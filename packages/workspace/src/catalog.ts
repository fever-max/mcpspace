export type McpCatalogEntry = {
  package: string
  command: string
  args: string[]
  env: Record<string, string>
  description: string
}

export const MCP_CATALOG: Record<string, McpCatalogEntry> = {
  filesystem: {
    package: '@modelcontextprotocol/server-filesystem',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '.'],
    env: {},
    description: 'Read and write local files and directories',
  },
  github: {
    package: '@modelcontextprotocol/server-github',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '<YOUR_GITHUB_TOKEN>' },
    description: 'Interact with GitHub repositories, issues, and pull requests',
  },
  playwright: {
    package: '@playwright/mcp',
    command: 'npx',
    args: ['-y', '@playwright/mcp'],
    env: {},
    description: 'Browser automation and web scraping',
  },
  fetch: {
    package: 'mcp-server-fetch',
    command: 'uvx',
    args: ['mcp-server-fetch'],
    env: {},
    description: 'Fetch web content and convert HTML to markdown (requires uv/Python)',
  },
  memory: {
    package: '@modelcontextprotocol/server-memory',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-memory'],
    env: {},
    description: 'Persistent key-value memory across conversations',
  },
  postgres: {
    package: '@modelcontextprotocol/server-postgres',
    command: 'npx',
    args: [
      '-y',
      '@modelcontextprotocol/server-postgres',
      'postgresql://user:password@localhost:5432/mydb',
    ],
    env: {},
    description: 'Query and manage PostgreSQL databases (edit the connection URL in args)',
  },
  sqlite: {
    package: 'mcp-server-sqlite-npx',
    command: 'npx',
    args: ['-y', 'mcp-server-sqlite-npx', './db.sqlite'],
    env: {},
    description: 'Query and manage SQLite databases (edit the db path in args)',
  },
  slack: {
    package: '@modelcontextprotocol/server-slack',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: { SLACK_BOT_TOKEN: '<YOUR_SLACK_BOT_TOKEN>', SLACK_TEAM_ID: '<YOUR_SLACK_TEAM_ID>' },
    description: 'Read and send Slack messages',
  },
  'brave-search': {
    package: '@modelcontextprotocol/server-brave-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: '<YOUR_BRAVE_API_KEY>' },
    description: 'Web search powered by Brave Search API',
  },
  'google-maps': {
    package: '@modelcontextprotocol/server-google-maps',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-google-maps'],
    env: { GOOGLE_MAPS_API_KEY: '<YOUR_GOOGLE_MAPS_API_KEY>' },
    description: 'Search places, directions, and geocoding via Google Maps',
  },
  'aws-kb-retrieval': {
    package: '@modelcontextprotocol/server-aws-kb-retrieval',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-aws-kb-retrieval'],
    env: {
      AWS_ACCESS_KEY_ID: '<YOUR_AWS_ACCESS_KEY_ID>',
      AWS_SECRET_ACCESS_KEY: '<YOUR_AWS_SECRET_ACCESS_KEY>',
      AWS_REGION: 'us-east-1',
    },
    description: 'Retrieve documents from AWS Knowledge Base',
  },
  sequentialthinking: {
    package: '@modelcontextprotocol/server-sequential-thinking',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
    env: {},
    description: 'Dynamic problem-solving through sequential thinking',
  },
  context7: {
    package: '@upstash/context7-mcp',
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp'],
    env: {},
    description: 'Fetch up-to-date library documentation and code examples',
  },
  git: {
    package: 'mcp-server-git',
    command: 'uvx',
    args: ['mcp-server-git', '--repository', '.'],
    env: {},
    description: 'Read git history, diffs, branches, and commits (requires uv/Python)',
  },
  linear: {
    package: 'mcp-remote',
    command: 'npx',
    args: ['-y', 'mcp-remote', 'https://mcp.linear.app/sse'],
    env: {},
    description: 'Manage Linear issues and projects (auth opens in browser)',
  },
  notion: {
    package: '@notionhq/notion-mcp-server',
    command: 'npx',
    args: ['-y', '@notionhq/notion-mcp-server'],
    env: { NOTION_TOKEN: '<YOUR_NOTION_TOKEN>' },
    description: 'Read and write Notion pages and databases',
  },
  figma: {
    package: 'figma-developer-mcp',
    command: 'npx',
    args: ['-y', 'figma-developer-mcp', '--stdio'],
    env: { FIGMA_API_KEY: '<YOUR_FIGMA_API_KEY>' },
    description: 'Access Figma design files and components',
  },
  exa: {
    package: 'exa-mcp-server',
    command: 'npx',
    args: ['-y', 'exa-mcp-server'],
    env: { EXA_API_KEY: '<YOUR_EXA_API_KEY>' },
    description: 'AI-powered web search and content retrieval via Exa',
  },
}
