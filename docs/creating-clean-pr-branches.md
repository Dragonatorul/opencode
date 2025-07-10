# Creating Clean PR Branches from Messy Development

This document outlines the process for extracting clean, PR-ready feature branches from messy development branches that contain extra files, experimental code, or improper commit history.

## Problem Statement

When developing features in a personal fork, you often end up with:
- Extra files (documentation, scripts, experiments)
- Messy commit history with multiple iterations
- Mixed changes across unrelated files
- Personal configuration or test files
- Non-atomic commits that combine multiple logical changes

However, for upstream PRs, you need:
- Clean, focused commits with single logical changes
- Only essential files for the feature
- Professional commit messages
- No personal or unrelated files
- Minimal surface area to reduce review burden

## Solution: Clean Branch Extraction

Instead of trying to clean up existing commits (which can be complex and error-prone), create a new clean branch and selectively copy only the essential changes.

## Step-by-Step Process

### 1. Create Clean Feature Branch from Upstream

```bash
# Fetch latest upstream changes
git fetch upstream

# Create new branch from clean upstream state
git checkout -b feat/feature-name upstream/dev
```

**Why this works:**
- Starts with a clean slate from upstream
- No history pollution from development branch
- Ensures compatibility with latest upstream changes

### 2. Identify Essential Files

```bash
# Switch back to development branch to analyze changes
git checkout development-branch

# See all changed files
git diff upstream/dev --name-only

# Filter to only essential files for the feature
git diff upstream/dev --name-only | grep -E "packages/.*/(feature|core)/"
```

**Categorize files:**
- ✅ **Essential**: Core feature implementation files
- ✅ **Integration**: Minimal changes to existing files
- ❌ **Personal**: Installation scripts, personal configs
- ❌ **Documentation**: Can be added in separate PR
- ❌ **Experimental**: Test files, prototypes

### 3. Copy Files with Clean Implementation

```bash
# Switch to clean feature branch
git checkout feat/feature-name

# Create necessary directories
mkdir -p path/to/feature/directory

# Copy specific files using git show (preserves exact content)
git show development-branch:path/to/file.ts > path/to/file.ts
git show development-branch:path/to/another.ts > path/to/another.ts
```

**Why use `git show` instead of `cp`:**
- Gets exact file content from specific commit
- Avoids copying any local modifications
- Works even if files have been moved or renamed
- Preserves exact implementation without extra changes

### 4. Make Minimal Integration Changes

For files that need modification (like adding imports), edit manually:

```bash
# Edit integration files with minimal changes
vim packages/opencode/src/index.ts

# Add only the essential imports and registrations
# Keep changes as small as possible
```

**Integration principles:**
- Minimal surface area - change as few lines as possible
- Backward compatibility - don't break existing functionality
- Clear separation - feature code vs integration code

### 5. Create Atomic Commits

Create commits that each represent one logical change:

```bash
# Commit 1: Core system
git add packages/opencode/src/feature/
git commit -m "feat: add feature core system

- Add FeatureTypes with validation
- Implement feature loader and executor
- Support configuration and context injection
- Enable extensibility for user customization

This provides the foundation without any CLI changes."

# Commit 2: CLI commands
git add packages/opencode/src/cli/cmd/feature*.ts
git commit -m "feat: add feature CLI commands

- Add /feature command for management
- Add /f command for execution
- Support comprehensive operations
- Include error handling and validation

Commands work independently and can be used immediately."

# Commit 3: Integration
git add packages/opencode/src/index.ts
git commit -m "feat: integrate feature commands into CLI

- Register FeatureCommand in main CLI
- Maintain compatibility with existing commands
- Enable feature usage: 'opencode /feature list'

This completes the feature integration."
```

**Atomic commit principles:**
- One logical change per commit
- Each commit should build and work independently
- Clear, descriptive commit messages
- Follow conventional commit format
- Explain the "why" not just the "what"

### 6. Push and Create PR

```bash
# Push clean feature branch
git push -u origin feat/feature-name

# Create PR (via GitHub UI or gh CLI)
gh pr create --title "feat: add feature system" --body "Description..."
```

## Real Example: Slash Functions

Here's how we applied this process to extract the slash functions feature:

### Files Identified
```
Essential files (copied):
✅ packages/opencode/src/slash/types.ts
✅ packages/opencode/src/slash/loader.ts  
✅ packages/opencode/src/slash/executor.ts
✅ packages/opencode/src/slash/git.ts
✅ packages/opencode/src/cli/cmd/f.ts
✅ packages/opencode/src/cli/cmd/func.ts

Integration changes (manual):
✅ packages/opencode/src/index.ts (4 lines added)

Excluded from PR:
❌ scripts/install-ocd.sh (personal fork specific)
❌ docs/ files (can be separate PR)
❌ AGENTS.md (personal configuration)
❌ Other experimental files
```

### Clean Commits Created
```
5492b20 feat: integrate slash function commands into CLI
51488dc feat: add slash function CLI commands  
8fca314 feat: add slash function core system
```

### Commands Used
```bash
# 1. Create clean branch
git checkout -b feat/slash-functions upstream/dev

# 2. Copy essential files
git show personal-features:packages/opencode/src/slash/types.ts > packages/opencode/src/slash/types.ts
git show personal-features:packages/opencode/src/slash/loader.ts > packages/opencode/src/slash/loader.ts
# ... (repeat for each file)

# 3. Manual integration
vim packages/opencode/src/index.ts
# Added 4 lines: 2 imports + 2 command registrations

# 4. Atomic commits
git add packages/opencode/src/slash/
git commit -m "feat: add slash function core system..."

git add packages/opencode/src/cli/cmd/f*.ts
git commit -m "feat: add slash function CLI commands..."

git add packages/opencode/src/index.ts
git commit -m "feat: integrate slash function commands into CLI..."
```

## Benefits of This Approach

### For Maintainers
- **Clean review**: Only essential changes to review
- **Minimal risk**: Small surface area reduces chance of bugs
- **Clear intent**: Atomic commits show logical progression
- **Easy revert**: Each commit can be reverted independently

### For Contributors
- **No history cleanup**: Avoid complex git rebase/squash operations
- **Flexible development**: Keep messy development branch for experiments
- **Professional presentation**: Clean commits show attention to quality
- **Reusable process**: Same approach works for any feature

### For Project
- **Maintainable**: Clean history makes future debugging easier
- **Documented**: Clear commit messages explain design decisions
- **Modular**: Features can be easily understood and modified
- **Quality**: Forces thinking about minimal, essential changes

## Best Practices

### Commit Messages
```bash
# Good: Explains what and why
feat: add user authentication system

- Implement JWT-based authentication
- Add login/logout endpoints
- Support role-based access control
- Enable session management

This provides secure user access without breaking existing APIs.

# Bad: Just describes what changed
feat: add auth stuff

- added some files
- modified index.ts
```

### File Selection
```bash
# Good: Only essential files
packages/core/src/auth/
packages/core/src/cli/cmd/auth.ts
packages/core/src/index.ts (minimal changes)

# Bad: Everything including personal stuff
packages/core/src/auth/
scripts/my-personal-setup.sh
docs/my-notes.md
test-data/
.vscode/settings.json
```

### Integration Changes
```bash
# Good: Minimal integration
// Add 2 imports
import { AuthCommand } from "./cli/cmd/auth"
import { AuthMiddleware } from "./auth/middleware"

// Add 1 command registration  
.command(AuthCommand)

# Bad: Large refactoring
// Restructure entire CLI system
// Change existing command patterns
// Modify core architecture
```

## Troubleshooting

### "File not found" when using git show
```bash
# Check if file exists in source branch
git show development-branch --name-only | grep filename

# Use correct path relative to repo root
git show development-branch:packages/opencode/src/file.ts
```

### Merge conflicts during integration
```bash
# Check what changed in upstream since branching
git log --oneline upstream/dev ^feat/feature-name

# Rebase onto latest upstream if needed
git rebase upstream/dev
```

### Missing dependencies or imports
```bash
# Check what imports the original file had
git show development-branch:path/to/file.ts | head -20

# Ensure all dependencies are copied or available
```

## When NOT to Use This Approach

This process is overkill for:
- **Simple bug fixes**: Just cherry-pick the fix commit
- **Documentation only**: No code changes needed
- **Single file changes**: Direct editing is simpler
- **Already clean commits**: If development history is already good

Use this approach when:
- **Multiple files involved**: Complex features with many changes
- **Messy development history**: Lots of experimental commits
- **Mixed changes**: Feature code mixed with personal stuff
- **Professional presentation needed**: Upstream PR or code review

## Conclusion

Creating clean PR branches from messy development is a valuable skill that:
- Improves code review quality
- Demonstrates professional development practices  
- Makes features easier to understand and maintain
- Increases likelihood of upstream acceptance

The key is to think of it as "feature extraction" rather than "history cleanup" - you're creating a new, clean representation of your feature rather than trying to fix the existing messy one.

This approach scales to any size feature and any level of development messiness, making it a reliable tool for contributing to open source projects.