#!/bin/bash
# OpenCodeDragonator Installation Script
# Installs personal fork of opencode with slash function features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_URL="https://github.com/Dragonatorul/opencode.git"
BRANCH="personal-features"
INSTALL_DIR="$HOME/.tools/opencode-custom"
BIN_DIR="$HOME/.local/bin"
ALIAS_NAME="ocd"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    # Check for git
    if ! command -v git &> /dev/null; then
        log_error "git is required but not installed"
        exit 1
    fi
    
    # Check for node/npm or bun
    if ! command -v npm &> /dev/null && ! command -v bun &> /dev/null; then
        log_error "npm or bun is required but neither is installed"
        exit 1
    fi
    
    # Prefer bun if available
    if command -v bun &> /dev/null; then
        PACKAGE_MANAGER="bun"
        RUN_COMMAND="bun run"
    else
        PACKAGE_MANAGER="npm"
        RUN_COMMAND="npm run"
    fi
    
    log_success "Dependencies check passed (using $PACKAGE_MANAGER)"
}

clone_repository() {
    log_info "Cloning OpenCodeDragonator repository..."
    
    # Remove existing installation if it exists
    if [ -d "$INSTALL_DIR" ]; then
        log_warning "Existing installation found, removing..."
        rm -rf "$INSTALL_DIR"
    fi
    
    # Clone the repository
    git clone -b "$BRANCH" "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    
    log_success "Repository cloned to $INSTALL_DIR"
}

install_dependencies() {
    log_info "Installing dependencies..."
    cd "$INSTALL_DIR"
    
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun install
    else
        npm install
    fi
    
    log_success "Dependencies installed"
}

create_wrapper_scripts() {
    log_info "Creating wrapper scripts..."
    
    # Ensure bin directory exists
    mkdir -p "$BIN_DIR"
    
    # Create main wrapper script
    cat > "$BIN_DIR/$ALIAS_NAME" << 'EOF'
#!/bin/bash
# OpenCodeDragonator (ocd) - Personal fork of opencode with slash functions

INSTALL_DIR="$HOME/.tools/opencode-custom"
CACHE_FILE="$HOME/.cache/ocd-update-check"
UPDATE_INTERVAL=86400  # 24 hours in seconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if installation exists
if [ ! -d "$INSTALL_DIR" ]; then
    echo -e "${RED}Error:${NC} OpenCodeDragonator not found at $INSTALL_DIR"
    echo "Run the installation script to set up ocd"
    exit 1
fi

# Function to check for updates
check_updates() {
    local current_time=$(date +%s)
    local last_check=0
    
    # Read last check time if cache exists
    if [ -f "$CACHE_FILE" ]; then
        last_check=$(cat "$CACHE_FILE" 2>/dev/null || echo 0)
    fi
    
    # Only check if enough time has passed
    if [ $((current_time - last_check)) -gt $UPDATE_INTERVAL ]; then
        cd "$INSTALL_DIR" 2>/dev/null || return 1
        
        # Quick background fetch with timeout
        timeout 3s git fetch origin 2>/dev/null &
        local fetch_pid=$!
        
        # Continue without waiting for fetch
        # Check if we're behind (only if fetch completed quickly)
        sleep 0.5
        if ! kill -0 $fetch_pid 2>/dev/null; then
            # Fetch completed, check if behind
            local behind=$(git rev-list --count HEAD..origin/personal-features 2>/dev/null || echo "")
            
            if [[ -n "$behind" && "$behind" -gt 0 ]]; then
                echo -e "${YELLOW}⚠️  Updates available for ocd${NC}"
                echo -n "Update now? (y/N) [5s timeout]: "
                if read -t 5 -n 1 -r && [[ $REPLY =~ ^[Yy]$ ]]; then
                    echo
                    echo "Updating..."
                    ocd-update && echo "Updated! Continuing..." && sleep 1
                else
                    echo
                    echo -e "${YELLOW}Continuing with current version. Run 'ocd-update' later.${NC}"
                fi
            fi
        else
            # Kill the background fetch if still running
            kill $fetch_pid 2>/dev/null || true
        fi
        
        # Update cache
        mkdir -p "$(dirname "$CACHE_FILE")"
        echo "$current_time" > "$CACHE_FILE"
    fi
}

# Determine package manager
if command -v bun &> /dev/null; then
    PACKAGE_MANAGER="bun"
    RUN_COMMAND="bun run"
else
    PACKAGE_MANAGER="npm"  
    RUN_COMMAND="npm run"
fi

# Check for updates (gracefully)
check_updates 2>/dev/null || true

# Launch OpenCodeDragonator
cd "$INSTALL_DIR"
if [ "$PACKAGE_MANAGER" = "bun" ]; then
    exec bun run packages/opencode/src/index.ts "$@"
else
    exec node packages/opencode/src/index.ts "$@"
fi
EOF

    # Create update script
    cat > "$BIN_DIR/$ALIAS_NAME-update" << 'EOF'
#!/bin/bash
# OpenCodeDragonator Update Script

INSTALL_DIR="$HOME/.tools/opencode-custom"
BRANCH="personal-features"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if installation exists
if [ ! -d "$INSTALL_DIR" ]; then
    log_error "OpenCodeDragonator not found at $INSTALL_DIR"
    exit 1
fi

cd "$INSTALL_DIR"

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    log_error "Installation directory is not a git repository"
    exit 1
fi

log_info "Updating OpenCodeDragonator..."

# Fetch latest changes
log_info "Fetching latest changes..."
if ! git fetch origin; then
    log_error "Failed to fetch from remote"
    exit 1
fi

# Check if we're behind
BEHIND=$(git rev-list --count HEAD..origin/$BRANCH 2>/dev/null || echo "0")
if [ "$BEHIND" = "0" ]; then
    log_success "Already up to date"
    exit 0
fi

log_info "Found $BEHIND new commits, updating..."

# Stash any local changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    log_info "Stashing local changes..."
    git stash push -m "Auto-stash before update $(date)"
fi

# Pull latest changes
if ! git pull origin "$BRANCH"; then
    log_error "Failed to pull latest changes"
    exit 1
fi

# Determine package manager and reinstall dependencies
if command -v bun &> /dev/null; then
    PACKAGE_MANAGER="bun"
else
    PACKAGE_MANAGER="npm"
fi

# Check if package.json changed and reinstall if needed
if git diff HEAD~$BEHIND HEAD --name-only | grep -q "package.json"; then
    log_info "Package dependencies changed, reinstalling..."
    if [ "$PACKAGE_MANAGER" = "bun" ]; then
        bun install
    else
        npm install
    fi
fi

# Clear update cache to force fresh check next time
rm -f "$HOME/.cache/ocd-update-check"

log_success "OpenCodeDragonator updated successfully!"
log_info "Changes:"
git log --oneline HEAD~$BEHIND..HEAD
EOF

    # Make scripts executable
    chmod +x "$BIN_DIR/$ALIAS_NAME"
    chmod +x "$BIN_DIR/$ALIAS_NAME-update"
    
    log_success "Wrapper scripts created in $BIN_DIR"
}

setup_path() {
    log_info "Setting up PATH..."
    
    # Check if ~/.local/bin is in PATH
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        log_warning "~/.local/bin is not in PATH"
        
        # Add to common shell profiles
        for profile in "$HOME/.bashrc" "$HOME/.zshrc" "$HOME/.profile"; do
            if [ -f "$profile" ]; then
                if ! grep -q "/.local/bin" "$profile"; then
                    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$profile"
                    log_info "Added ~/.local/bin to PATH in $profile"
                fi
            fi
        done
        
        log_warning "Please restart your shell or run: export PATH=\"\$HOME/.local/bin:\$PATH\""
    else
        log_success "PATH is already configured"
    fi
}

test_installation() {
    log_info "Testing installation..."
    
    # Test if ocd command works
    if command -v "$ALIAS_NAME" &> /dev/null; then
        log_success "Command '$ALIAS_NAME' is available"
        
        # Test basic functionality
        cd "$INSTALL_DIR"
        if [ "$PACKAGE_MANAGER" = "bun" ]; then
            if bun run packages/opencode/src/index.ts --version &> /dev/null; then
                log_success "OpenCodeDragonator is working correctly"
            else
                log_warning "OpenCodeDragonator may have issues (check dependencies)"
            fi
        else
            log_info "Installation complete (npm mode - manual testing recommended)"
        fi
    else
        log_error "Command '$ALIAS_NAME' not found in PATH"
        log_info "You may need to restart your shell or add ~/.local/bin to PATH"
    fi
}

print_usage() {
    echo
    log_success "OpenCodeDragonator installation complete!"
    echo
    echo "Usage:"
    echo "  $ALIAS_NAME                    # Start interactive mode"
    echo "  $ALIAS_NAME run \"message\"      # Run with message"
    echo "  $ALIAS_NAME /func list         # List slash functions"
    echo "  $ALIAS_NAME /f readme          # Execute readme function"
    echo "  $ALIAS_NAME-update             # Update to latest version"
    echo
    echo "Slash Functions:"
    echo "  $ALIAS_NAME /func create <name>  # Create new function"
    echo "  $ALIAS_NAME /func edit <name>    # Edit function"
    echo "  $ALIAS_NAME /f <name>            # Execute function"
    echo
    echo "Git Integration:"
    echo "  $ALIAS_NAME /func init           # Initialize function git repo"
    echo "  $ALIAS_NAME /func status         # Check function repo status"
    echo "  $ALIAS_NAME /func commit         # Commit function changes"
    echo
    if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
        echo -e "${YELLOW}Note: Restart your shell or run 'export PATH=\"\$HOME/.local/bin:\$PATH\"'${NC}"
    fi
}

# Main installation flow
main() {
    echo "OpenCodeDragonator Installation Script"
    echo "======================================"
    echo
    
    check_dependencies
    clone_repository
    install_dependencies
    create_wrapper_scripts
    setup_path
    test_installation
    print_usage
}

# Run main function
main "$@"