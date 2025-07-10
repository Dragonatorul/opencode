# Slash Functions Implementation Plan

## Overview
Implement a custom slash function system for OpenCode that allows users to define and execute pre-configured functions with predefined prompts. This feature will be maintained as a personal fork with regular upstream updates.

## Current Status
- **Repository**: Fork of sst/opencode at https://github.com/Dragonatorul/opencode
- **Current Branch**: `dev` (tracking upstream/dev)
- **Target Branch**: `personal-features` (to be created)
- **Installation Alias**: `ocd` (OpenCodeDragonator)

## Branch Strategy
```bash
# Create feature branch from current dev
git checkout -b personal-features
git push -u origin personal-features
```

**Principles**:
- Keep `dev` branch clean and matching upstream
- All custom features go in `personal-features` branch
- Use atomic commits for clean PR potential
- Regular rebase from upstream to stay current

## Architecture Design

### 1. Slash Function System
**Location**: `packages/opencode/src/cli/cmd/slash-functions.ts`

**Functionality**:
- Parse `/functionname` commands in CLI
- Load function definitions from `~/.config/opencode/functions/`
- Execute predefined prompts with context injection
- Integrate with existing opencode session system

### 2. Function Definition Format
**Location**: `~/.config/opencode/functions/`

**Structure**:
```bash
~/.config/opencode/functions/
├── readme.json          # Function definition
├── summarymd.json       # Function definition
└── custom-func.json     # User-defined functions
```

**JSON Format**:
```json
{
  "name": "readme",
  "description": "Generate or enhance README.md for current project",
  "prompt": "Please analyze this codebase and create/enhance README.md...",
  "context": ["project_structure", "package_json", "existing_readme"]
}
```

### 3. CLI Integration
**Location**: `packages/opencode/src/cli/index.ts`

**Changes**:
- Add slash function command parser
- Route `/functionname` to slash function handler
- Maintain compatibility with existing commands

## Installation System

### 1. Installation Script
**File**: `install-ocd.sh`

**Actions**:
- Clone repository to `~/.tools/opencode-custom/`
- Install dependencies with `npm install`
- Create wrapper scripts in `~/.local/bin/`
- Configure PATH if needed
- Test installation

### 2. Runtime Wrapper
**File**: `~/.local/bin/ocd`

**Features**:
- Smart update checking (cached, graceful failure)
- 5-second timeout prompt for updates
- Launch opencode with all arguments passed through

### 3. Update Script
**File**: `~/.local/bin/ocd-update`

**Actions**:
- Fetch latest from origin/personal-features
- Rebase current installation
- Reinstall dependencies if needed
- Report status and any conflicts

## Implementation Steps

### Phase 1: Core Infrastructure
1. **Create personal-features branch**
2. **Implement slash function parser** in CLI
3. **Create function loader** for JSON definitions
4. **Add basic function execution** framework

### Phase 2: Function System
1. **Design JSON schema** for function definitions
2. **Implement context injection** system
3. **Add error handling** and validation
4. **Create built-in functions** (readme, summarymd)

### Phase 3: Installation System
1. **Create installation script**
2. **Implement wrapper scripts**
3. **Add update mechanism**
4. **Test on clean environment**

### Phase 4: Documentation & Polish
1. **Write user documentation**
2. **Add function creation guide**
3. **Implement help system**
4. **Performance optimization**

## File Structure Changes

```
packages/opencode/src/
├── cli/
│   ├── cmd/
│   │   ├── slash-functions.ts     # NEW: Slash function handler
│   │   └── ...
│   └── index.ts                   # MODIFIED: Add slash routing
├── slash/                         # NEW: Slash function system
│   ├── loader.ts                  # Function definition loader
│   ├── executor.ts                # Function execution engine
│   ├── context.ts                 # Context injection system
│   └── types.ts                   # Type definitions
└── ...

scripts/                           # NEW: Installation scripts
├── install-ocd.sh
├── ocd-wrapper.sh
└── ocd-update.sh

docs/plans/                        # NEW: Documentation
└── slash-functions-implementation.md
```

## Compatibility Considerations

### Upstream Merge Potential
- **Minimal core changes**: Keep modifications small and focused
- **Backward compatibility**: All existing functionality unchanged
- **Optional feature**: Can be disabled/ignored if not wanted
- **Clean separation**: Slash functions isolated in own module

### Update Strategy
```bash
# Regular upstream sync
git checkout dev
git pull upstream dev
git checkout personal-features
git rebase dev
```

## Testing Strategy

### Development Testing
- Test in current repository location
- Use `bun run dev` for immediate feedback
- Validate against existing opencode functionality

### Installation Testing
- Test installation script on clean environment
- Verify wrapper scripts work correctly
- Test update mechanism with mock changes

### Function Testing
- Create test function definitions
- Validate JSON schema parsing
- Test context injection accuracy

## Migration from Current ::function System

### Existing Functions
Current `~/.config/claude/functions/` bash scripts:
- `readme` - Generate/enhance README
- `summarymd` - Create project summary
- `functions` - List available functions
- `listf` - Alias for functions

### Migration Strategy
1. **Convert bash scripts** to JSON definitions
2. **Preserve functionality** with equivalent prompts
3. **Maintain backward compatibility** during transition
4. **Provide migration tool** for user functions

## Success Criteria

### Functional Requirements
- [ ] Slash functions work in opencode CLI
- [ ] Functions load from user config directory
- [ ] Context injection works correctly
- [ ] Installation system works on clean machine
- [ ] Update mechanism maintains user customizations

### Quality Requirements
- [ ] No breaking changes to existing opencode functionality
- [ ] Clean, atomic commits for potential upstream PR
- [ ] Comprehensive error handling
- [ ] Performance impact minimal
- [ ] Documentation complete and clear

## Risk Mitigation

### Technical Risks
- **Merge conflicts**: Regular rebasing and minimal changes
- **Performance impact**: Lazy loading and caching
- **Breaking changes**: Comprehensive testing before commits

### Maintenance Risks
- **Upstream divergence**: Automated update checking
- **Feature complexity**: Start simple, iterate
- **User adoption**: Clear documentation and examples

## Next Steps

1. **Create personal-features branch**
2. **Implement basic slash function parser**
3. **Create minimal function loader**
4. **Test with simple function definition**
5. **Iterate and expand functionality**

---

**Note**: This document should be updated as implementation progresses to reflect actual decisions and changes made during development.