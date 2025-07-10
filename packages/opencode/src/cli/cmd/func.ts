import type { Argv } from "yargs"
import { SlashLoader } from "../../slash/loader"
import { SlashFunction } from "../../slash/types"
import { FuncGit } from "../../slash/git"
import { Global } from "../../global"
import { UI } from "../ui"
import { cmd } from "./cmd"
import { bootstrap } from "../bootstrap"
import path from "path"

export const FuncCommand = cmd({
  command: "func <action> [name] [args..]",
  describe: "manage slash functions",
  builder: (yargs: Argv) => {
    return yargs
      .positional("action", {
        describe: "action to perform",
        type: "string",
        choices: ["list", "create", "edit", "delete", "status", "commit", "push", "pull", "init", "clone"],
        demandOption: true,
      })
      .positional("name", {
        describe: "function name (required for create, edit, delete)",
        type: "string",
      })
      .positional("args", {
        describe: "additional arguments",
        type: "string",
        array: true,
        default: [],
      })
      .option("message", {
        alias: "m",
        describe: "commit message (for commit action)",
        type: "string",
      })
      .option("type", {
        alias: "t", 
        describe: "change type for versioning",
        type: "string",
        choices: ["patch", "minor", "major"],
      })
  },
  async handler(args) {
    await bootstrap()

    const functionsDir = path.join(Global.Path.config, "functions")
    const action = args.action as string
    const name = args.name as string | undefined
    const additionalArgs = args.args as string[]

    try {
      switch (action) {
        case "list":
          await handleList()
          break
        case "create":
          if (!name) {
            UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Function name required for create`)
            return
          }
          await handleCreate(name, additionalArgs)
          break
        case "edit":
          if (!name) {
            UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Function name required for edit`)
            return
          }
          await handleEdit(name)
          break
        case "delete":
          if (!name) {
            UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Function name required for delete`)
            return
          }
          await handleDelete(name)
          break
        case "status":
          await handleStatus()
          break
        case "commit":
          const message = args.message as string || "Update functions"
          const changeType = args.type as "patch" | "minor" | "major" || "patch"
          await handleCommit(message, changeType)
          break
        case "push":
          await handlePush()
          break
        case "pull":
          await handlePull()
          break
        case "init":
          await handleInit()
          break
        case "clone":
          if (!name) {
            UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Repository URL required for clone`)
            return
          }
          await handleClone(name)
          break
        default:
          UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Unknown action: ${action}`)
      }
    } catch (error) {
      UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} ${error instanceof Error ? error.message : error}`)
    }
  },
})

async function handleList() {
  const functions = await SlashLoader.loadFunctions()
  const isGit = await FuncGit.isGitRepo()
  
  if (Object.keys(functions).length === 0) {
    UI.print("No slash functions available.")
    UI.print(`Create function definitions in ${Global.Path.config}/functions/`)
    return
  }

  UI.print("Available Slash Functions:")
  UI.print("=" .repeat(25))
  if (isGit) {
    try {
      const version = await FuncGit.getCurrentVersion()
      UI.print(`${UI.Style.TEXT_DIM}Repository version: v${version}${UI.Style.RESET}`)
    } catch (error) {
      // Ignore version errors
    }
  }
  UI.print("")
  
  Object.values(functions).forEach(func => {
    const source = isBuiltinFunction(func.name) ? 
      `${UI.Style.TEXT_DIM}(built-in)${UI.Style.RESET}` : 
      `${UI.Style.TEXT_SUCCESS}(user)${UI.Style.RESET}`
    UI.print(`${UI.Style.TEXT_SUCCESS_BOLD}${func.name}${UI.Style.RESET} ${source} - ${func.description}`)
  })
  
  UI.print("")
  UI.print("Usage: opencode /f <function-name> [args...]")
  if (isGit) {
    UI.print(`${UI.Style.TEXT_DIM}Git repository detected - changes will be versioned${UI.Style.RESET}`)
  }
}

async function handleCreate(name: string, args: string[]) {
  const functionsDir = path.join(Global.Path.config, "functions")
  const filePath = path.join(functionsDir, `${name}.json`)
  
  // Check if function already exists
  const existingFile = Bun.file(filePath)
  if (await existingFile.exists()) {
    UI.print(`${UI.Style.TEXT_WARNING_BOLD}Warning:${UI.Style.RESET} Function '${name}' already exists`)
    return
  }

  // Create function definition
  const description = args.join(" ") || `${name} function`
  const functionDef: SlashFunction.Info = {
    name,
    description,
    prompt: `Please help with ${name}.\n\n[Edit this function with: opencode /func edit ${name}]`,
    context: ["project_structure"]
  }

  // Ensure directory exists
  await Bun.write(path.join(functionsDir, ".gitkeep"), "")
  
  // Write function definition
  await Bun.write(filePath, JSON.stringify(functionDef, null, 2))
  
  UI.print(`${UI.Style.TEXT_SUCCESS_BOLD}Created${UI.Style.RESET} function '${name}'`)
  UI.print(`Edit with: ${UI.Style.TEXT_INFO}opencode /func edit ${name}${UI.Style.RESET}`)
  UI.print(`Use with: ${UI.Style.TEXT_INFO}opencode /f ${name}${UI.Style.RESET}`)

  // Auto-commit if git repo
  const isGit = await FuncGit.isGitRepo()
  if (isGit) {
    try {
      const changeType = FuncGit.detectChangeType("create", name)
      const version = await FuncGit.commit(`feat: add ${name} function`, changeType)
      UI.print(`${UI.Style.TEXT_SUCCESS}Auto-committed as v${version}${UI.Style.RESET}`)
    } catch (error) {
      UI.print(`${UI.Style.TEXT_WARNING}Warning: Could not auto-commit: ${error instanceof Error ? error.message : error}${UI.Style.RESET}`)
    }
  }
}

async function handleEdit(name: string) {
  const functionsDir = path.join(Global.Path.config, "functions")
  const filePath = path.join(functionsDir, `${name}.json`)
  
  // Check if function exists
  const file = Bun.file(filePath)
  if (!(await file.exists())) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Function '${name}' not found`)
    return
  }

  UI.print(`Opening ${name}.json for editing...`)
  UI.print(`File location: ${filePath}`)
  UI.print(`${UI.Style.TEXT_DIM}Edit the file and run 'opencode /func commit' to save changes${UI.Style.RESET}`)
  
  // Try to open with default editor
  try {
    const editor = process.env.EDITOR || "nano"
    const process = Bun.spawn({
      cmd: [editor, filePath],
      stdio: ["inherit", "inherit", "inherit"],
    })
    await process.exited
  } catch (error) {
    UI.print(`${UI.Style.TEXT_WARNING}Could not open editor. Edit manually: ${filePath}${UI.Style.RESET}`)
  }
}

async function handleDelete(name: string) {
  const functionsDir = path.join(Global.Path.config, "functions")
  const filePath = path.join(functionsDir, `${name}.json`)
  
  // Check if function exists
  const file = Bun.file(filePath)
  if (!(await file.exists())) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Function '${name}' not found`)
    return
  }

  // Delete file
  await Bun.write(filePath, "") // Clear file
  const rmProcess = Bun.spawn({
    cmd: ["rm", filePath],
    stdout: "pipe",
    stderr: "pipe",
  })
  await rmProcess.exited

  UI.print(`${UI.Style.TEXT_SUCCESS_BOLD}Deleted${UI.Style.RESET} function '${name}'`)

  // Auto-commit if git repo
  const isGit = await FuncGit.isGitRepo()
  if (isGit) {
    try {
      const changeType = FuncGit.detectChangeType("delete", name)
      const version = await FuncGit.commit(`feat: remove ${name} function`, changeType)
      UI.print(`${UI.Style.TEXT_SUCCESS}Auto-committed as v${version}${UI.Style.RESET}`)
    } catch (error) {
      UI.print(`${UI.Style.TEXT_WARNING}Warning: Could not auto-commit: ${error instanceof Error ? error.message : error}${UI.Style.RESET}`)
    }
  }
}

async function handleStatus() {
  const isGit = await FuncGit.isGitRepo()
  
  if (!isGit) {
    UI.print("Functions directory is not a git repository")
    UI.print(`Run ${UI.Style.TEXT_INFO}opencode /func init${UI.Style.RESET} to initialize git tracking`)
    return
  }

  try {
    const status = await FuncGit.status()
    const version = await FuncGit.getCurrentVersion()
    
    UI.print(`Functions Repository Status (v${version}):`)
    UI.print("=" .repeat(35))
    
    if (status.trim() === "") {
      UI.print(`${UI.Style.TEXT_SUCCESS}Working directory clean${UI.Style.RESET}`)
    } else {
      UI.print("Changes:")
      status.split("\n").forEach(line => {
        if (line.trim()) {
          UI.print(`  ${line}`)
        }
      })
      UI.print("")
      UI.print(`Run ${UI.Style.TEXT_INFO}opencode /func commit${UI.Style.RESET} to commit changes`)
    }
  } catch (error) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} ${error instanceof Error ? error.message : error}`)
  }
}

async function handleCommit(message: string, changeType: "patch" | "minor" | "major") {
  const isGit = await FuncGit.isGitRepo()
  
  if (!isGit) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Not a git repository`)
    return
  }

  try {
    const version = await FuncGit.commit(message, changeType)
    UI.print(`${UI.Style.TEXT_SUCCESS_BOLD}Committed${UI.Style.RESET} changes as v${version}`)
    UI.print(`Run ${UI.Style.TEXT_INFO}opencode /func push${UI.Style.RESET} to push to remote`)
  } catch (error) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} ${error instanceof Error ? error.message : error}`)
  }
}

async function handlePush() {
  const isGit = await FuncGit.isGitRepo()
  
  if (!isGit) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Not a git repository`)
    return
  }

  try {
    await FuncGit.push()
    UI.print(`${UI.Style.TEXT_SUCCESS_BOLD}Pushed${UI.Style.RESET} changes to remote repository`)
  } catch (error) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} ${error instanceof Error ? error.message : error}`)
  }
}

async function handlePull() {
  const isGit = await FuncGit.isGitRepo()
  
  if (!isGit) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} Not a git repository`)
    return
  }

  try {
    await FuncGit.pull()
    UI.print(`${UI.Style.TEXT_SUCCESS_BOLD}Pulled${UI.Style.RESET} latest changes from remote`)
  } catch (error) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} ${error instanceof Error ? error.message : error}`)
  }
}

async function handleInit() {
  const isGit = await FuncGit.isGitRepo()
  
  if (isGit) {
    UI.print(`${UI.Style.TEXT_WARNING_BOLD}Warning:${UI.Style.RESET} Already a git repository`)
    return
  }

  try {
    await FuncGit.init()
    UI.print(`${UI.Style.TEXT_SUCCESS_BOLD}Initialized${UI.Style.RESET} git repository for functions`)
    UI.print("Your functions will now be versioned automatically")
  } catch (error) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} ${error instanceof Error ? error.message : error}`)
  }
}

async function handleClone(url: string) {
  try {
    await FuncGit.clone(url)
    UI.print(`${UI.Style.TEXT_SUCCESS_BOLD}Cloned${UI.Style.RESET} function repository from ${url}`)
    UI.print("Functions are now available for use")
  } catch (error) {
    UI.print(`${UI.Style.TEXT_DANGER_BOLD}Error:${UI.Style.RESET} ${error instanceof Error ? error.message : error}`)
  }
}

function isBuiltinFunction(name: string): boolean {
  return ["readme", "summarymd"].includes(name)
}