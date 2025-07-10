import type { Argv } from "yargs"
import { SlashExecutor } from "../../slash/executor"
import { SlashLoader } from "../../slash/loader"
import { Session } from "../../session"
import { UI } from "../ui"
import { cmd } from "./cmd"
import { bootstrap } from "../bootstrap"

export const FCommand = cmd({
  command: "f <function> [args..]",
  describe: "execute a slash function",
  builder: (yargs: Argv) => {
    return yargs
      .positional("function", {
        describe: "name of the function to execute",
        type: "string",
        demandOption: true,
      })
      .positional("args", {
        describe: "arguments to pass to the function",
        type: "string",
        array: true,
        default: [],
      })
      .option("list", {
        alias: "l",
        describe: "list available slash functions",
        type: "boolean",
      })
      .option("dry-run", {
        alias: "d",
        describe: "show the generated prompt without executing",
        type: "boolean",
      })
  },
  async handler(args) {
    await bootstrap()

    // Handle list option (redirect to /func list)
    if (args.list) {
      UI.print("Use 'opencode /func list' to see available functions")
      return
    }

    const functionName = args.function as string
    const functionArgs = args.args as string[]
    const dryRun = args["dry-run"] as boolean

    try {
      // Always reload functions to catch newly created ones
      const functions = await SlashLoader.loadFunctions()
      
      if (!functions[functionName]) {
        const available = Object.keys(functions)
        UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Function '${functionName}' not found`)
        
        if (available.length > 0) {
          UI.print("")
          UI.print("Available functions:")
          available.forEach(name => {
            UI.print(`  ${UI.Style.TEXT_SUCCESS}${name}${UI.Style.RESET}`)
          })
        } else {
          UI.print("No functions available. Create one with:")
          UI.print(`  ${UI.Style.TEXT_INFO}opencode /func create ${functionName}${UI.Style.RESET}`)
        }
        return
      }

      // Execute the slash function to get the prompt
      const prompt = await SlashExecutor.execute(functionName, functionArgs)
      
      if (dryRun) {
        UI.print(`${UI.Style.TEXT_INFO_BOLD}Generated prompt for '${functionName}':${UI.Style.RESET}`)
        UI.print("=" .repeat(50))
        UI.print(prompt)
        UI.print("=" .repeat(50))
        UI.print(`${UI.Style.TEXT_DIM}Use without --dry-run to execute${UI.Style.RESET}`)
        return
      }

      // Show what function is being executed
      const func = functions[functionName]
      UI.print(`${UI.Style.TEXT_SUCCESS_BOLD}Executing:${UI.Style.RESET} ${func.description}`)
      UI.print("")

      // Create a new session with the generated prompt
      const session = await Session.create({
        message: prompt,
        providerID: "anthropic", // Default provider - could be configurable
      })

      // Start the session (this will handle the conversation)
      await session.run()

    } catch (error) {
      UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} ${error instanceof Error ? error.message : error}`)
      UI.print("")
      UI.print("Available commands:")
      UI.print(`  ${UI.Style.TEXT_INFO}opencode /func list${UI.Style.RESET} - List available functions`)
      UI.print(`  ${UI.Style.TEXT_INFO}opencode /func create <name>${UI.Style.RESET} - Create new function`)
    }
  },
})