import { SlashFunction } from "./types"
import { SlashLoader } from "./loader"
import { Log } from "../util/log"
import { App } from "../app/app"

export namespace SlashExecutor {
  const log = Log.create({ service: "slash-executor" })

  export async function execute(functionName: string, args: string[] = []): Promise<string> {
    try {
      const functions = await SlashLoader.loadFunctions()
      const func = functions[functionName]

      if (!func) {
        const available = Object.keys(functions).join(", ")
        throw new Error(`Function '${functionName}' not found. Available: ${available}`)
      }

      log.info("executing slash function", { name: functionName, args })

      // Inject context if specified
      let prompt = func.prompt
      if (func.context) {
        const context = await injectContext(func.context)
        prompt = `${context}\n\n${prompt}`
      }

      // Replace any parameter placeholders
      if (func.parameters && args.length > 0) {
        prompt = replaceParameters(prompt, func.parameters, args)
      }

      return prompt
    } catch (error) {
      log.error("failed to execute slash function", { 
        name: functionName, 
        error: error instanceof Error ? error.message : error 
      })
      throw error
    }
  }

  async function injectContext(contextTypes: string[]): Promise<string> {
    const context: string[] = []
    const app = App.info()

    for (const type of contextTypes) {
      switch (type) {
        case "project_structure":
          context.push(`<project_structure>`)
          context.push(`Working directory: ${app.path.cwd}`)
          context.push(`Git repository: ${app.git ? "yes" : "no"}`)
          context.push(`</project_structure>`)
          break

        case "package_json":
          try {
            const packagePath = `${app.path.cwd}/package.json`
            const packageFile = Bun.file(packagePath)
            if (await packageFile.exists()) {
              const content = await packageFile.text()
              context.push(`<package_json>`)
              context.push(content)
              context.push(`</package_json>`)
            }
          } catch (error) {
            log.warn("failed to load package.json", { error })
          }
          break

        case "existing_readme":
          try {
            const readmePath = `${app.path.cwd}/README.md`
            const readmeFile = Bun.file(readmePath)
            if (await readmeFile.exists()) {
              const content = await readmeFile.text()
              context.push(`<existing_readme>`)
              context.push(content)
              context.push(`</existing_readme>`)
            }
          } catch (error) {
            log.warn("failed to load README.md", { error })
          }
          break

        case "git_history":
          // Could add git log context here
          break

        case "dependencies":
          // Could add dependency analysis here
          break

        default:
          log.warn("unknown context type", { type })
      }
    }

    return context.join("\n")
  }

  function replaceParameters(prompt: string, parameters: Record<string, string>, args: string[]): string {
    let result = prompt
    
    // Simple parameter replacement - could be enhanced
    Object.entries(parameters).forEach(([key, defaultValue], index) => {
      const value = args[index] || defaultValue
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
    })

    return result
  }
}