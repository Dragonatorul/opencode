import { SlashFunction, SlashFunctionConfig } from "./types"
import { Global } from "../global"
import { Log } from "../util/log"
import path from "path"

export namespace SlashLoader {
  const log = Log.create({ service: "slash-loader" })

  export async function loadFunctions(): Promise<Record<string, SlashFunction.Info>> {
    const functionsDir = path.join(Global.Path.config, "functions")
    const functions: Record<string, SlashFunction.Info> = {}

    try {
      // Check if functions directory exists
      const dir = Bun.file(functionsDir)
      if (!(await dir.exists())) {
        log.info("functions directory not found", { path: functionsDir })
        return functions
      }

      // Load built-in functions first
      Object.assign(functions, await loadBuiltinFunctions())

      // Load user-defined functions
      const userFunctions = await loadUserFunctions(functionsDir)
      Object.assign(functions, userFunctions)

      log.info("loaded functions", { count: Object.keys(functions).length })
      return functions
    } catch (error) {
      log.error("failed to load functions", { error: error instanceof Error ? error.message : error })
      return functions
    }
  }

  async function loadBuiltinFunctions(): Promise<Record<string, SlashFunction.Info>> {
    return {
      readme: {
        name: "readme",
        description: "Generate or enhance README.md for current project",
        prompt: `Please analyze this codebase and create/enhance a comprehensive README.md file.

Analyze the codebase structure, package.json, and existing documentation to create a professional README.md that includes:

1. Project title and description
2. Installation instructions  
3. Usage examples
4. Available scripts/commands
5. Project structure overview
6. Contributing guidelines (if applicable)
7. License information

Make it clear, concise, and helpful for developers who want to understand and use this project.`,
        context: ["project_structure", "package_json", "existing_readme"]
      },
      summarymd: {
        name: "summarymd",
        description: "Create detailed markdown summary in .reports folder",
        prompt: `Please create a comprehensive markdown summary of this project and save it to the .reports folder.

Create a detailed summary that includes:

1. **Project Overview** - Purpose, technologies, architecture
2. **Codebase Structure** - Directory structure and key files  
3. **Dependencies & Configuration** - Package analysis and build tools
4. **Code Analysis** - Entry points, core functionality, APIs
5. **Development Workflow** - Setup, scripts, testing, deployment
6. **Recent Changes** - Git history and modifications
7. **Technical Debt & Opportunities** - Code quality and improvements

Make this a comprehensive technical document for new developers.`,
        context: ["project_structure", "git_history", "dependencies"]
      }
    }
  }

  async function loadUserFunctions(functionsDir: string): Promise<Record<string, SlashFunction.Info>> {
    const functions: Record<string, SlashFunction.Info> = {}

    try {
      // Read all .json files in functions directory
      const glob = new Bun.Glob("*.json")
      for await (const file of glob.scan({ cwd: functionsDir })) {
        try {
          const filePath = path.join(functionsDir, file)
          const content = await Bun.file(filePath).text()
          const parsed = JSON.parse(content)
          
          // Validate function definition
          const functionDef = SlashFunction.Info.parse(parsed)
          functions[functionDef.name] = functionDef
          
          log.info("loaded user function", { name: functionDef.name, file })
        } catch (error) {
          log.error("failed to load function file", { 
            file, 
            error: error instanceof Error ? error.message : error 
          })
        }
      }
    } catch (error) {
      log.error("failed to scan functions directory", { 
        dir: functionsDir,
        error: error instanceof Error ? error.message : error 
      })
    }

    return functions
  }
}