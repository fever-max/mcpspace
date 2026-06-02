import { homedir } from 'node:os'
import { resolve } from 'node:path'

import {
  FileAtomicWriter,
  FileConfigLoader,
  FileStateRepository,
  type AtomicWriter,
  type ConfigLoader,
  type PathResolver,
  type StateRepository,
} from '@mcpspace/core'
import {
  type AdapterFactory,
  type AdapterName,
  type ClientAdapter,
  ClaudeCodeAdapter,
  ClaudeDesktopAdapter,
  CodexAdapter,
  CursorAdapter,
} from '@mcpspace/adapters'
import { DefaultReconciler } from '@mcpspace/reconciler'
import {
  DefaultMcpRegistryService,
  DefaultWorkspaceService,
  FileDesiredStateRepository,
  type McpRegistryService,
  type WorkspaceService,
} from '@mcpspace/workspace'

export type CliServices = {
  workspace: WorkspaceService
  mcp: McpRegistryService
  version: string
}

class CliPathResolver implements PathResolver {
  getProjectConfigPath(options?: {
    cwd?: string | undefined
    explicitConfigPath?: string | undefined
    envConfigPath?: string | undefined
  }): string {
    if (options?.explicitConfigPath) {
      return options.explicitConfigPath
    }

    if (options?.envConfigPath) {
      return options.envConfigPath
    }

    return resolve(options?.cwd ?? process.cwd(), '.mcpspace', 'config.yaml')
  }

  getGlobalConfigPath(): string {
    return resolve(homedir(), '.mcpspace', 'config.yaml')
  }

  getGlobalStatePath(): string {
    return resolve(homedir(), '.mcpspace', 'state.json')
  }

  getInstallDir(): string {
    return resolve(homedir(), '.mcpspace', 'tools')
  }

  getBackupDir(): string {
    return resolve(homedir(), '.mcpspace', 'backups')
  }
}

class LocalAdapterFactory implements AdapterFactory {
  constructor(private readonly pathResolver: PathResolver) {}

  get(client: string): ClientAdapter {
    const name = client as AdapterName
    if (name === 'claude-desktop') {
      return new ClaudeDesktopAdapter(this.pathResolver)
    }

    if (name === 'claude-code') {
      return new ClaudeCodeAdapter(this.pathResolver)
    }

    if (name === 'codex') {
      return new CodexAdapter(this.pathResolver)
    }

    if (name === 'cursor') {
      return new CursorAdapter(this.pathResolver)
    }

    throw new Error(
      `Unsupported client '${client}'. Use: claude-desktop, claude-code, codex, cursor`,
    )
  }
}

export const createServices = (): CliServices => {
  const pathResolver = new CliPathResolver()
  const atomicWriter: AtomicWriter = new FileAtomicWriter()
  const configLoader: ConfigLoader = new FileConfigLoader(pathResolver)
  const stateRepository: StateRepository = new FileStateRepository(
    pathResolver,
    atomicWriter,
  )

  const adapterFactory = new LocalAdapterFactory(pathResolver)
  const reconciler = new DefaultReconciler()
  const desiredStateRepository = new FileDesiredStateRepository(
    configLoader,
    atomicWriter,
  )

  const workspace = new DefaultWorkspaceService(
    configLoader,
    stateRepository,
    adapterFactory,
    reconciler,
    desiredStateRepository,
  )

  const mcp = new DefaultMcpRegistryService(configLoader, desiredStateRepository)

  return {
    workspace,
    mcp,
    version: '0.1.0',
  }
}
