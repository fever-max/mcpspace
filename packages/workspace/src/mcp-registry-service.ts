import type { ConfigLoader, McpspaceConfig } from '@mcpspace/core'

import { MCP_CATALOG } from './catalog.js'
import type { DesiredStateRepository } from './types.js'

export type McpAddOptions = {
  command?: string
  args?: string[]
  env?: Record<string, string>
  package?: string
}

export type McpListItem = {
  toolName: string
  package: string
  command: string
  clients: string[]
}

export interface McpRegistryService {
  add(toolName: string, options?: McpAddOptions): Promise<McpspaceConfig>
  update(toolName: string, nextToolName: string, options?: McpAddOptions): Promise<McpspaceConfig>
  remove(toolName: string): Promise<McpspaceConfig>
  list(): Promise<McpListItem[]>
}

export class DefaultMcpRegistryService implements McpRegistryService {
  constructor(
    private readonly configLoader: ConfigLoader,
    private readonly desiredStateRepository: DesiredStateRepository,
  ) {}

  async add(toolName: string, options: McpAddOptions = {}): Promise<McpspaceConfig> {
    const config = await this.configLoader.loadProjectConfig()
    if (config.mcps[toolName]) {
      throw new Error(`MCP '${toolName}' is already registered.`)
    }

    config.mcps[toolName] = this.buildMcpEntry(toolName, options)

    await this.desiredStateRepository.save(config)
    return config
  }

  async update(toolName: string, nextToolName: string, options: McpAddOptions = {}): Promise<McpspaceConfig> {
    const config = await this.configLoader.loadProjectConfig()

    if (!config.mcps[toolName]) {
      throw new Error(`MCP '${toolName}' is not registered.`)
    }

    if (toolName !== nextToolName && config.mcps[nextToolName]) {
      throw new Error(`MCP '${nextToolName}' is already registered.`)
    }

    const currentEntry = config.mcps[toolName]
    const entry = this.mergeMcpEntry(toolName, currentEntry, nextToolName, options)
    const clients = Object.entries(config.clients)
      .filter(([, state]) => state.mcps.includes(toolName))
      .map(([client]) => client)

    delete config.mcps[toolName]
    config.mcps[nextToolName] = entry

    if (toolName !== nextToolName) {
      for (const clientName of clients) {
        const client = config.clients[clientName]
        client.mcps = client.mcps.map((value) => (value === toolName ? nextToolName : value))
      }
    }

    await this.desiredStateRepository.save(config)
    return config
  }

  async remove(toolName: string): Promise<McpspaceConfig> {
    const config = await this.configLoader.loadProjectConfig()

    if (!config.mcps[toolName]) {
      throw new Error(`MCP '${toolName}' is not registered.`)
    }

    for (const [client, state] of Object.entries(config.clients)) {
      if (state.mcps.includes(toolName)) {
        throw new Error(
          `MCP '${toolName}' is assigned to '${client}'. Detach first: mcpspace detach ${toolName} ${client}`,
        )
      }
    }

    delete config.mcps[toolName]
    await this.desiredStateRepository.save(config)
    return config
  }

  async list(): Promise<McpListItem[]> {
    const config = await this.configLoader.loadProjectConfig()
    const items: McpListItem[] = []

    for (const [toolName, entry] of Object.entries(config.mcps)) {
      const clients = Object.entries(config.clients)
        .filter(([, state]) => state.mcps.includes(toolName))
        .map(([client]) => client)
        .sort()

      items.push({
        toolName,
        package: entry.package,
        command: entry.command,
        clients,
      })
    }

    items.sort((a, b) => a.toolName.localeCompare(b.toolName))
    return items
  }

  private buildMcpEntry(toolName: string, options: McpAddOptions): McpspaceConfig['mcps'][string] {
    const catalogEntry = MCP_CATALOG[toolName]

    if (catalogEntry) {
      return {
        package: options.package ?? catalogEntry.package,
        command: options.command ?? catalogEntry.command,
        args: options.args ? [...options.args] : [...catalogEntry.args],
        env: options.env ? { ...options.env } : { ...catalogEntry.env },
      }
    }

    if (options.command) {
      return {
        package: options.package ?? '',
        command: options.command,
        args: options.args ? [...options.args] : [],
        env: options.env ? { ...options.env } : {},
      }
    }

    throw new Error(
      `Unknown MCP '${toolName}'. Use --command to register a custom MCP.\n` +
        `Example: mcpspace mcp add ${toolName} --command npx --arg -y --arg ${toolName}`,
    )
  }

  private mergeMcpEntry(
    toolName: string,
    currentEntry: McpspaceConfig['mcps'][string],
    nextToolName: string,
    options: McpAddOptions,
  ): McpspaceConfig['mcps'][string] {
    if (toolName === nextToolName) {
      const catalogEntry = MCP_CATALOG[nextToolName]
      return {
        package: options.package ?? currentEntry.package ?? catalogEntry?.package ?? '',
        command: options.command ?? currentEntry.command ?? catalogEntry?.command ?? '',
        args: options.args ? [...options.args] : [...(currentEntry.args ?? catalogEntry?.args ?? [])],
        env: options.env ? { ...options.env } : { ...(currentEntry.env ?? catalogEntry?.env ?? {}) },
      }
    }

    return this.buildMcpEntry(nextToolName, options)
  }
}

