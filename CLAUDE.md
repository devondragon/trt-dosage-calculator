# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands
- Development: `npm run dev` - Runs the project locally using Wrangler
- Tests: `npm test` - Runs all tests with Jest
- Single test: `npx jest test/path-to-test.test.ts` - Run a specific test file
- Linting: `npm run lint` - Runs ESLint and Prettier checks
- Formatting: `npm run format` - Auto-formats code with Prettier
- Deploy: `npm run publish` - Deploys to Cloudflare Workers

## Code Style Guidelines
- **TypeScript**: Use strict typing with proper interfaces/types
- **Formatting**: 2-space indentation, semicolons, single quotes for strings
- **Imports**: Group imports (external libraries first, then internal)
- **Error Handling**: Use try/catch blocks for async operations
- **Naming**: camelCase for variables/functions, PascalCase for classes/interfaces
- **Functions**: Annotate with return types, especially for async functions
- **API Responses**: Include proper status codes and headers
- **HTML/CSS**: Use consistent indentation and meaningful class names