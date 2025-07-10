import type { Argv } from "yargs"
import { SlashExecutor } from "../../slash/executor"
import { SlashLoader } from "../../slash/loader"
import { Session } from "../../session"
import { UI } from "../ui"
import { cmd } from "./cmd"
import { bootstrap } from "../bootstrap"

export const SlashFunctionsCommand = cmd({
  command: "/$function [args..]",
  describe: "execute a predefined slash function",
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
  },
  async handler(args) {
    await bootstrap()

    // Handle list option
    if (args.list) {
      const functions = await SlashLoader.loadFunctions()
      
      if (Object.keys(functions).length === 0) {
        UI.print("No slash functions available.")
        UI.print("Create function definitions in ~/.config/opencode/functions/")
        return
      }

      UI.print("Available Slash Functions:")
      UI.print("=" .repeat(25))
      UI.print("")
      
      Object.values(functions).forEach(func => {
        UI.print(`/${UI.Style.TEXT_SUCCESS_BOLD}${func.name}${UI.Style.RESET} - ${func.description}`)
      })
      
      UI.print("")
      UI.print("Usage: opencode /<function-name> [args...]")
      return
    }

    const functionName = args.function
    if (!functionName) {
      UI.print("Error: Function name required")
      UI.print("Use --list to see available functions")
      return
    }

    try {
      // Execute the slash function to get the prompt
      const prompt = await SlashExecutor.execute(functionName, args.args as string[])
      
      // Create a new session with the generated prompt
      const session = await Session.create({
        message: prompt,
        providerID: "anthropic", // Default provider
      })

      // Start the session (this will handle the conversation)
      await session.run()

    } catch (error) {
      UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} ${error instanceof Error ? error.message : error}`)
      UI.print("")
      UI.print("Use --list to see available functions")
    }
  },
})