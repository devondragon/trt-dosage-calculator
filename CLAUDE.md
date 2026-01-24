# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build/Test/Lint Commands
- Development: `npm run dev` - Runs locally at http://localhost:8787 using Wrangler
- Tests: `npm test` - Runs all tests with Jest (uses `--experimental-vm-modules` for ES modules)
- Single test: `npx jest test/index.test.ts` - Run the test file
- Linting: `npm run lint` - Runs ESLint and Prettier checks
- Formatting: `npm run format` - Auto-formats code with Prettier
- Deploy: `npm run publish` - Deploys to Cloudflare Workers

## Architecture

This is a Cloudflare Worker application (ES modules format) that calculates TRT injection dosages. The entire application is in a single file (`src/index.ts`) with embedded HTML/CSS/JS for the web interface.

### Request Flow
The worker exports a default `fetch` handler that routes requests:
- `/` → `serveForm()` - Returns the HTML calculator interface
- `/calculate-dose` → `handleCalculateDose()` - Legacy GET endpoint (returns only `dosePerShotMl`)
- `/api/v1/calculate` → `handleApiCalculate()` - REST API supporting both GET and POST (returns full response)

### Core Logic
`calculateDosage()` function handles all calculation and validation:
- Accepts `targetWeeklyDose`, `testosteroneStrength`, and either `shotsPerWeek` OR `shotEveryXDays`
- Returns `DosageResponse` with `dosePerShotMl`, `dosePerShotMg`, `shotsPerWeek`, `frequency`
- Returns `{ error: string }` for validation failures

### Testing
Tests import the worker directly and call `worker.fetch()` with mock Request objects. No mocking framework needed - tests run against the actual handler code.

## Code Style Guidelines
- **TypeScript**: Use strict typing with proper interfaces/types
- **Formatting**: 2-space indentation, semicolons, single quotes for strings
- **Imports**: Group imports (external libraries first, then internal)
- **Naming**: camelCase for variables/functions, PascalCase for interfaces
- **API Responses**: Include CORS headers and proper status codes (400 for validation errors)