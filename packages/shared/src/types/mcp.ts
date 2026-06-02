export type McpConfig = {
  package: string
  command: string
  args?: string[]
  env?: Record<string, string>
}
