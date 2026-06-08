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
    env: { GITHUB_PERSONAL_ACCESS_TOKEN: '' },
    description: 'Interact with GitHub repositories, issues, and pull requests',
  },
  playwright: {
    package: '@modelcontextprotocol/server-playwright',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-playwright'],
    env: {},
    description: 'Browser automation and web scraping',
  },
  fetch: {
    package: '@modelcontextprotocol/server-fetch',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-fetch'],
    env: {},
    description: 'Fetch web content and REST APIs',
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
    args: ['-y', '@modelcontextprotocol/server-postgres', '${POSTGRES_URL}'],
    env: { POSTGRES_URL: '' },
    description: 'Query and manage PostgreSQL databases',
  },
  sqlite: {
    package: '@modelcontextprotocol/server-sqlite',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-sqlite', '--db-path', './db.sqlite'],
    env: {},
    description: 'Query and manage SQLite databases',
  },
  slack: {
    package: '@modelcontextprotocol/server-slack',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-slack'],
    env: { SLACK_BOT_TOKEN: '', SLACK_TEAM_ID: '' },
    description: 'Read and send Slack messages',
  },
  'brave-search': {
    package: '@modelcontextprotocol/server-brave-search',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-brave-search'],
    env: { BRAVE_API_KEY: '' },
    description: 'Web search powered by Brave Search API',
  },
  'google-maps': {
    package: '@modelcontextprotocol/server-google-maps',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-google-maps'],
    env: { GOOGLE_MAPS_API_KEY: '' },
    description: 'Search places, directions, and geocoding via Google Maps',
  },
  'aws-kb-retrieval': {
    package: '@modelcontextprotocol/server-aws-kb-retrieval',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-aws-kb-retrieval'],
    env: { AWS_ACCESS_KEY_ID: '', AWS_SECRET_ACCESS_KEY: '', AWS_REGION: '' },
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
    package: '@modelcontextprotocol/server-git',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-git', '--repository', '.'],
    env: {},
    description: 'Read git history, diffs, branches, and commits',
  },
  linear: {
    package: '@modelcontextprotocol/server-linear',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-linear'],
    env: { LINEAR_API_KEY: '' },
    description: 'Manage Linear issues, projects, and teams',
  },
  notion: {
    package: '@modelcontextprotocol/server-notion',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-notion'],
    env: { NOTION_API_KEY: '' },
    description: 'Read and write Notion pages and databases',
  },
  figma: {
    package: '@modelcontextprotocol/server-figma',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-figma'],
    env: { FIGMA_API_KEY: '' },
    description: 'Access Figma design files and components',
  },
  exa: {
    package: 'exa-mcp-server',
    command: 'npx',
    args: ['-y', 'exa-mcp-server'],
    env: { EXA_API_KEY: '' },
    description: 'AI-powered web search and content retrieval via Exa',
  },
}
