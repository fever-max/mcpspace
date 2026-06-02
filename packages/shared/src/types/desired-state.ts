import type { McpConfig } from './mcp.js'

export type DesiredState = {
  version: string
  mcps: Record<string, McpConfig>
  clients: Record<string, { mcps: string[] }>
}
