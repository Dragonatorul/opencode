import { Log } from "../util/log"
import { Global } from "../global"
import path from "path"

export namespace FuncGit {
  const log = Log.create({ service: "func-git" })

  export async function isGitRepo(dir?: string): Promise<boolean> {
    const functionsDir = dir || path.join(Global.Path.config, "functions")
    
    try {
      const process = Bun.spawn({
        cmd: ["git", "rev-parse", "--git-dir"],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      
      await process.exited
      return process.exitCode === 0
    } catch (error) {
      return false
    }
  }

  export async function status(dir?: string): Promise<string> {
    const functionsDir = dir || path.join(Global.Path.config, "functions")
    
    if (!(await isGitRepo(functionsDir))) {
      throw new Error("Not a git repository")
    }

    try {
      const process = Bun.spawn({
        cmd: ["git", "status", "--porcelain"],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      
      await process.exited
      const stdout = await new Response(process.stdout).text()
      
      if (process.exitCode !== 0) {
        const stderr = await new Response(process.stderr).text()
        throw new Error(`Git status failed: ${stderr}`)
      }
      
      return stdout.trim()
    } catch (error) {
      log.error("git status failed", { error })
      throw error
    }
  }

  export async function getCurrentVersion(dir?: string): Promise<string> {
    const functionsDir = dir || path.join(Global.Path.config, "functions")
    
    try {
      // Try to get latest tag
      const process = Bun.spawn({
        cmd: ["git", "describe", "--tags", "--abbrev=0"],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      
      await process.exited
      
      if (process.exitCode === 0) {
        const stdout = await new Response(process.stdout).text()
        return stdout.trim().replace(/^v/, "") // Remove 'v' prefix if present
      }
      
      // No tags found, start with 0.1.0
      return "0.0.0"
    } catch (error) {
      return "0.0.0"
    }
  }

  export async function bumpVersion(changeType: "patch" | "minor" | "major", currentVersion: string): Promise<string> {
    const [major, minor, patch] = currentVersion.split(".").map(Number)
    
    switch (changeType) {
      case "major":
        return `${major + 1}.0.0`
      case "minor":
        return `${major}.${minor + 1}.0`
      case "patch":
        return `${major}.${minor}.${patch + 1}`
      default:
        throw new Error(`Invalid change type: ${changeType}`)
    }
  }

  export async function commit(message: string, changeType: "patch" | "minor" | "major", dir?: string): Promise<string> {
    const functionsDir = dir || path.join(Global.Path.config, "functions")
    
    if (!(await isGitRepo(functionsDir))) {
      throw new Error("Not a git repository")
    }

    try {
      // Get current version and bump it
      const currentVersion = await getCurrentVersion(functionsDir)
      const newVersion = await bumpVersion(changeType, currentVersion)
      
      // Stage all changes
      const addProcess = Bun.spawn({
        cmd: ["git", "add", "."],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      await addProcess.exited
      
      if (addProcess.exitCode !== 0) {
        const stderr = await new Response(addProcess.stderr).text()
        throw new Error(`Git add failed: ${stderr}`)
      }

      // Create commit with version
      const commitMessage = `${message}\n\nv${newVersion}`
      const commitProcess = Bun.spawn({
        cmd: ["git", "commit", "-m", commitMessage],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      await commitProcess.exited
      
      if (commitProcess.exitCode !== 0) {
        const stderr = await new Response(commitProcess.stderr).text()
        throw new Error(`Git commit failed: ${stderr}`)
      }

      // Create tag
      const tagProcess = Bun.spawn({
        cmd: ["git", "tag", `v${newVersion}`],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      await tagProcess.exited

      log.info("committed changes", { version: newVersion, message })
      return newVersion
    } catch (error) {
      log.error("git commit failed", { error })
      throw error
    }
  }

  export async function push(dir?: string): Promise<void> {
    const functionsDir = dir || path.join(Global.Path.config, "functions")
    
    if (!(await isGitRepo(functionsDir))) {
      throw new Error("Not a git repository")
    }

    try {
      // Push commits
      const pushProcess = Bun.spawn({
        cmd: ["git", "push"],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      await pushProcess.exited
      
      if (pushProcess.exitCode !== 0) {
        const stderr = await new Response(pushProcess.stderr).text()
        throw new Error(`Git push failed: ${stderr}`)
      }

      // Push tags
      const pushTagsProcess = Bun.spawn({
        cmd: ["git", "push", "--tags"],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      await pushTagsProcess.exited
      
      if (pushTagsProcess.exitCode !== 0) {
        const stderr = await new Response(pushTagsProcess.stderr).text()
        log.warn("failed to push tags", { stderr })
      }

      log.info("pushed changes to remote")
    } catch (error) {
      log.error("git push failed", { error })
      throw error
    }
  }

  export async function pull(dir?: string): Promise<void> {
    const functionsDir = dir || path.join(Global.Path.config, "functions")
    
    if (!(await isGitRepo(functionsDir))) {
      throw new Error("Not a git repository")
    }

    try {
      const process = Bun.spawn({
        cmd: ["git", "pull"],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      await process.exited
      
      if (process.exitCode !== 0) {
        const stderr = await new Response(process.stderr).text()
        throw new Error(`Git pull failed: ${stderr}`)
      }

      log.info("pulled latest changes")
    } catch (error) {
      log.error("git pull failed", { error })
      throw error
    }
  }

  export async function init(dir?: string): Promise<void> {
    const functionsDir = dir || path.join(Global.Path.config, "functions")
    
    try {
      // Create directory if it doesn't exist
      await Bun.write(path.join(functionsDir, ".gitkeep"), "")
      
      const process = Bun.spawn({
        cmd: ["git", "init"],
        cwd: functionsDir,
        stdout: "pipe",
        stderr: "pipe",
      })
      await process.exited
      
      if (process.exitCode !== 0) {
        const stderr = await new Response(process.stderr).text()
        throw new Error(`Git init failed: ${stderr}`)
      }

      // Create initial commit
      await commit("feat: initialize function repository", "minor", functionsDir)
      
      log.info("initialized git repository", { dir: functionsDir })
    } catch (error) {
      log.error("git init failed", { error })
      throw error
    }
  }

  export async function clone(url: string, dir?: string): Promise<void> {
    const functionsDir = dir || path.join(Global.Path.config, "functions")
    
    try {
      // Remove existing directory if it exists
      const rmProcess = Bun.spawn({
        cmd: ["rm", "-rf", functionsDir],
        stdout: "pipe",
        stderr: "pipe",
      })
      await rmProcess.exited

      const process = Bun.spawn({
        cmd: ["git", "clone", url, functionsDir],
        stdout: "pipe",
        stderr: "pipe",
      })
      await process.exited
      
      if (process.exitCode !== 0) {
        const stderr = await new Response(process.stderr).text()
        throw new Error(`Git clone failed: ${stderr}`)
      }

      log.info("cloned function repository", { url, dir: functionsDir })
    } catch (error) {
      log.error("git clone failed", { error })
      throw error
    }
  }

  export function detectChangeType(operation: string, functionName?: string): "patch" | "minor" | "major" {
    switch (operation) {
      case "create":
        return "minor" // New function is a minor version bump
      case "edit":
      case "update":
        return "patch" // Function modification is a patch
      case "delete":
      case "remove":
        return "major" // Removing function is breaking change
      default:
        return "patch"
    }
  }
}