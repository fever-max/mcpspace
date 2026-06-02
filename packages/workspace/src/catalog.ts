export type McpCatalogEntry = {
  package: string
  command: string
  args: string[]
  env: Record<string, string>
}

export const MCP_CATALOG: Record<string, McpCatalogEntry> = {
  filesystem: {
    package: '@modelcontextprotocol/server-filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    env: {},
  },
  github: {
    package: '@modelcontextprotocol/server-github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: {},
  },
  playwright: {
    package: '@modelcontextprotocol/server-playwright',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-playwright'],
    env: {},
  },
  fetch: {
    package: '@modelcontextprotocol/server-fetch',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    env: {},
  },
  memory: {
    package: '@modelcontextprotocol/server-memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    env: {},
  },
}
