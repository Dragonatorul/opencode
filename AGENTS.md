# OpenCode Agent Guidelines

## Build/Test Commands
- **Install**: `bun install`
- **Dev**: `bun run dev` (runs packages/opencode/src/index.ts)
- **Typecheck**: `bun run typecheck` (all packages)
- **Test**: `bun test` (runs all tests)
- **Single test**: `bun test test/tool/tool.test.ts` (specific test file)
- **Serve**: `bun run stainless` (API server for TUI client)

## Code Style & Conventions
- **Runtime**: Bun with TypeScript ESM modules
- **Formatting**: Prettier (semi: false, printWidth: 120)
- **Imports**: Relative imports for local modules, named imports preferred
- **Types**: Zod schemas for validation, TypeScript interfaces for structure
- **Naming**: camelCase for variables/functions, PascalCase for classes/namespaces
- **Variables**: Prefer single word names, avoid `let`, use `const`
- **Control flow**: Avoid `else` statements and `try`/`catch` where possible
- **Error handling**: Use Result patterns, avoid throwing exceptions in tools
- **File structure**: Namespace-based organization (e.g., `Tool.define()`, `Session.create()`)

## Architecture Patterns
- **Tools**: Implement `Tool.Info` interface with `execute()` method
- **Context**: Pass `sessionID` in tool context, use `App.provide()` for DI
- **Validation**: All inputs validated with Zod schemas + `.openapi()` extensions
- **Logging**: Use `Log.create({ service: "name" })` pattern
- **Storage**: Use `Storage` namespace for persistence
- **API**: Go TUI ↔ TypeScript server via stainless SDK (regenerate client after server changes)