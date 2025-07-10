# OpenCodeDragonator Installation

This directory contains installation scripts for OpenCodeDragonator (ocd), a personal fork of opencode with enhanced slash function capabilities.

## Quick Installation

```bash
# Download and run the installation script
curl -fsSL https://raw.githubusercontent.com/Dragonatorul/opencode/personal-features/scripts/install-ocd.sh | bash

# Or clone and run locally
git clone -b personal-features https://github.com/Dragonatorul/opencode.git
cd opencode/scripts
./install-ocd.sh
```

## What Gets Installed

### Installation Location
- **Main installation**: `~/.tools/opencode-custom/`
- **Executables**: `~/.local/bin/ocd` and `~/.local/bin/ocd-update`
- **Functions**: `~/.config/opencode/functions/` (created on first use)

### Commands Available After Installation
- `ocd` - Main OpenCodeDragonator command
- `ocd-update` - Update to latest version

## Features

### Slash Functions
```bash
# Function management
ocd /func list                    # List available functions
ocd /func create analyze          # Create new function
ocd /func edit readme             # Edit existing function

# Function execution  
ocd /f readme                     # Execute readme function
ocd /f summarymd                  # Execute summary function
ocd /f analyze                    # Execute custom function
```

### Git Integration
```bash
# Initialize function repository
ocd /func init

# Function versioning (automatic)
ocd /func create newfunction      # Auto-commits as minor version
ocd /func edit existingfunction   # Auto-commits as patch version

# Manual git operations
ocd /func status                  # Check repository status
ocd /func commit "message"        # Manual commit with versioning
ocd /func push                    # Push to remote
ocd /func pull                    # Pull latest functions
```

### Auto-Update System
- **Smart update checking**: Checks for updates once per day
- **5-second timeout prompt**: Option to update before running
- **Graceful fallback**: Works offline or with network issues
- **Manual updates**: `ocd-update` command

## Requirements

- **Git**: For cloning and function versioning
- **Node.js + npm** OR **Bun**: For running the application
- **Linux/macOS**: Bash-compatible shell

## Installation Process

1. **Dependency Check**: Verifies git and npm/bun are available
2. **Repository Clone**: Clones personal-features branch to `~/.tools/opencode-custom/`
3. **Dependency Installation**: Runs `npm install` or `bun install`
4. **Wrapper Creation**: Creates `ocd` and `ocd-update` scripts in `~/.local/bin/`
5. **PATH Setup**: Adds `~/.local/bin` to PATH if needed
6. **Testing**: Verifies installation works

## Uninstallation

```bash
# Remove installation
rm -rf ~/.tools/opencode-custom

# Remove executables
rm ~/.local/bin/ocd ~/.local/bin/ocd-update

# Remove functions (optional)
rm -rf ~/.config/opencode/functions

# Remove from PATH (manual - edit shell profile)
```

## Troubleshooting

### Command not found
```bash
# Check if ~/.local/bin is in PATH
echo $PATH | grep -q "$HOME/.local/bin" && echo "In PATH" || echo "Not in PATH"

# Add to PATH temporarily
export PATH="$HOME/.local/bin:$PATH"

# Add to PATH permanently (choose your shell)
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc  # Bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc   # Zsh
```

### Update issues
```bash
# Force update
cd ~/.tools/opencode-custom
git fetch origin
git reset --hard origin/personal-features
npm install  # or bun install
```

### Function issues
```bash
# Check function directory
ls -la ~/.config/opencode/functions/

# Reinitialize functions
ocd /func init

# Check git status
ocd /func status
```

## Development

### Testing Installation Locally
```bash
# Test in a clean environment (Docker recommended)
docker run -it --rm ubuntu:latest bash
apt update && apt install -y git curl
curl -fsSL https://raw.githubusercontent.com/Dragonatorul/opencode/personal-features/scripts/install-ocd.sh | bash
```

### Modifying Installation
1. Edit `install-ocd.sh`
2. Test changes locally
3. Commit to personal-features branch
4. Test with curl installation method

## Architecture

```
~/.tools/opencode-custom/           # Main installation
├── packages/opencode/src/          # Source code
├── scripts/install-ocd.sh          # Installation script
└── docs/plans/                     # Implementation docs

~/.local/bin/                       # User executables
├── ocd                            # Main wrapper script
└── ocd-update                     # Update script

~/.config/opencode/                 # Configuration
└── functions/                     # User function definitions
    ├── custom-func.json           # User functions
    └── .git/                      # Git repository (optional)
```

The installation creates a self-contained system that can be easily updated, shared, and maintained independently of the upstream opencode project.