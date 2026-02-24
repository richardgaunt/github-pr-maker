# CLAUDE.md

## Project Overview
GitHub PR Maker — a CLI tool that generates GitHub pull requests from a standard template and user input. Installed globally as a bin command.

## Tech Stack
- **Runtime**: Node.js (ES modules, `"type": "module"`)
- **Templating**: Nunjucks (`nunjucks` package)
- **Prompts**: `@inquirer/prompts` (input, confirm, search)
- **PR Creation**: GitHub CLI (`gh pr create`)
- **Testing**: Jest (with `--experimental-vm-modules` for ESM support)
- **Linting**: ESLint 9 flat config

## Commands
- `npm test` — run all tests
- `npm run lint` — lint
- `npm run lint:fix` — lint and fix
- `npm start` — run the CLI locally

## Project Structure
```
index.js                  # Main CLI entry point (all logic lives here)
templates/
  PULL_REQUEST_TEMPLATE.njk   # Nunjucks template for PR body
test/
  basic.test.js           # Jest tests
tickets/                  # Task tracking (kanban-style)
  todo/                   # Tickets ready to work on
  in-progress/            # Tickets currently being worked on
  refining/               # Tickets that need more detail
  done/                   # Completed tickets
```

## Ticket Workflow
Tickets are markdown files in `tickets/`. Move files between directories to track status:
- `todo/` → `in-progress/` → `done/`
- `refining/` holds tickets that need more detail before they're actionable

## Code Style
- ES modules (`import`/`export`)
- 2-space indentation, single quotes
- Functions are exported individually for testability
- CLI uses emoji prefixes in console output for UX
