export type McpServerEntry = {
  name: string
  command: string
  args: string[]
  env?: Record<string, string>
}

export type ActualState = {
  clientName: string
  mcpServers: Record<string, McpServerEntry>
}
