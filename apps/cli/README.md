# mcpspace

A CLI tool for managing MCP tools across AI clients (Claude, Cursor, Codex) with a single configuration.

## Installation

```bash
npm install -g mcpspace
```

**Requirements:** Node.js 22+

## Quick Start

```bash
# 1. Initialize in your project folder
mcpspace init

# 2. Register an MCP tool
mcpspace mcp add filesystem

# 3. Attach it to an AI client
mcpspace attach filesystem claude-code

# 4. Apply changes to the client config
mcpspace sync claude-code

# 5. Check status
mcpspace status
```

## Commands

| Command | Description |
|---|---|
| `mcpspace init` | Create `.mcpspace/config.yaml` in the current directory |
| `mcpspace mcp add <tool>` | Register an MCP tool |
| `mcpspace mcp remove <tool>` | Remove an MCP tool |
| `mcpspace mcp list` | List registered MCP tools |
| `mcpspace attach <tool> <client>` | Attach a tool to a client (updates Desired State) |
| `mcpspace detach <tool> <client>` | Detach a tool from a client (updates Desired State) |
| `mcpspace plan <client>` | Preview pending changes |
| `mcpspace sync <client>` | Apply changes to the client config |
| `mcpspace status` | Show sync status across all clients |

## Adding MCP Tools

From the catalog:

```bash
mcpspace mcp add filesystem
mcpspace mcp add github
mcpspace mcp add postgres
```

Custom tool:

```bash
mcpspace mcp add my-tool \
  --command npx \
  --arg -y \
  --arg @myorg/my-mcp-server \
  --env API_KEY=mykey
```

Options:

| Option | Description |
|---|---|
| `--command <cmd>` | Execution command (required for custom tools) |
| `--package <pkg>` | Package name (optional) |
| `--arg <value>` | Argument (repeatable) |
| `--env <KEY=VALUE>` | Environment variable (repeatable) |

## Supported Clients

| Client | ID |
|---|---|
| Claude Desktop | `claude-desktop` |
| Claude Code | `claude-code` |
| Codex | `codex` |
| Cursor | `cursor` |

## How It Works

- `attach` / `detach` — Updates `.mcpspace/config.yaml` (Desired State) only. Does not touch client configs directly.
- `sync` — Applies Desired State to the actual client config. Automatically restores on failure.
- `plan` — Preview what `sync` will do before running it.
- `status` — Check whether each client is in sync with the Desired State.

## Troubleshooting

**`mcpspace` command not found**
- Re-run `npm link` and open a new terminal
- Check that the npm global bin path is in your PATH

**PowerShell execution policy error (Windows)**
- Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`

**In Sync but MCP not showing in client**
- Restart the client app
- Make sure `sync` was run from the same project path the client is using
