import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, resolve } from 'node:path'

import {
  FileAtomicWriter,
  FileConfigLoader,
  FileStateRepository,
  type ConfigLoader,
  type McpspaceConfig,
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
import { DefaultReconciler, type SyncPlan } from '@mcpspace/reconciler'
import {
  DefaultMcpRegistryService,
  DefaultWorkspaceService,
  FileDesiredStateRepository,
  type McpRegistryService,
  type WorkspaceService,
} from '@mcpspace/workspace'

import {
  type ClientId,
  type ClientStatusDto,
  type McpConfigDto,
  type WorkspaceContextDto,
  type WorkspaceContextStatus,
  type WorkspaceStatusDto,
} from '../../shared/dtos.js'

const createDefaultConfig = (): McpspaceConfig => ({
  version: '1',
  mcps: {},
  clients: {},
})

type WorkspaceRuntime = {
  workspacePath: string
  configLoader: ConfigLoader
  desiredStateRepository: FileDesiredStateRepository
  workspaceService: WorkspaceService
  mcpRegistryService: McpRegistryService
}

class DesktopPathResolver implements PathResolver {
  constructor(private readonly workspacePath: string) {}

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

    return resolve(options?.cwd ?? this.workspacePath, '.mcpspace', 'config.yaml')
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

class DesktopAdapterFactory implements AdapterFactory {
  constructor(
    private readonly pathResolver: PathResolver,
    private readonly workspacePath: string,
  ) {}

  get(client: string): ClientAdapter {
    const name = client as AdapterName

    if (name === 'claude-desktop') {
      return new ClaudeDesktopAdapter(this.pathResolver)
    }

    if (name === 'claude-code') {
      return new ClaudeCodeAdapter(this.pathResolver, this.workspacePath)
    }

    if (name === 'codex') {
      return new CodexAdapter(this.pathResolver, this.workspacePath)
    }

    if (name === 'cursor') {
      return new CursorAdapter(this.pathResolver, this.workspacePath)
    }

    throw new Error(
      `Unsupported client '${client}'. Use: claude-desktop, claude-code, codex, cursor`,
    )
  }
}

const createWorkspaceRuntime = (workspacePath: string): WorkspaceRuntime => {
  const pathResolver = new DesktopPathResolver(workspacePath)
  const atomicWriter = new FileAtomicWriter()
  const configLoader: ConfigLoader = new FileConfigLoader(pathResolver)
  const stateRepository: StateRepository = new FileStateRepository(pathResolver, atomicWriter)
  const desiredStateRepository = new FileDesiredStateRepository(configLoader, atomicWriter)
  const adapterFactory = new DesktopAdapterFactory(pathResolver, workspacePath)
  const reconciler = new DefaultReconciler()

  return {
    workspacePath,
    configLoader,
    desiredStateRepository,
    workspaceService: new DefaultWorkspaceService(
      configLoader,
      stateRepository,
      adapterFactory,
      reconciler,
      desiredStateRepository,
    ),
    mcpRegistryService: new DefaultMcpRegistryService(configLoader, desiredStateRepository),
  }
}

const toSorted = (values: Iterable<string>): string[] => Array.from(values).sort()

const toWorkspaceContext = (
  workspacePath: string,
  status: WorkspaceContextStatus,
): WorkspaceContextDto => {
  const normalizedPath = resolve(workspacePath)
  return {
    path: normalizedPath,
    name: basename(normalizedPath),
    configPath: resolve(normalizedPath, '.mcpspace', 'config.yaml'),
    status,
    isOpen: true,
  }
}

const mapMcpTools = (desiredState: McpspaceConfig): McpConfigDto[] => {
  const clientsByTool = new Map<string, ClientId[]>()

  for (const [clientName, clientState] of Object.entries(desiredState.clients)) {
    for (const toolName of clientState.mcps) {
      const current = clientsByTool.get(toolName) ?? []
      current.push(clientName as ClientId)
      clientsByTool.set(toolName, current)
    }
  }

  return Object.entries(desiredState.mcps)
    .map(([toolName, entry]) => ({
      toolName,
      package: entry.package,
      command: entry.command,
      args: [...entry.args],
      env: { ...entry.env },
      clients: toSorted(clientsByTool.get(toolName) ?? []) as ClientId[],
    }))
    .sort((a, b) => a.toolName.localeCompare(b.toolName))
}

const mapClientStatus = (
  status: Awaited<ReturnType<WorkspaceService['status']>>['clients'][number],
): ClientStatusDto => ({
  clientName: status.clientName as ClientId,
  outOfSync: status.outOfSync,
  error: status.error,
  assignedMcpCount: status.desiredTools.length,
})

export class WorkspaceSession {
  private currentWorkspace: WorkspaceContextDto | null = null
  private runtime: WorkspaceRuntime | null = null

  current(): WorkspaceContextDto | null {
    return this.currentWorkspace
  }

  async open(workspacePath: string): Promise<WorkspaceContextDto> {
    const context = toWorkspaceContext(
      workspacePath,
      existsSync(resolve(workspacePath, '.mcpspace', 'config.yaml')) ? 'ready' : 'not_initialized',
    )

    this.currentWorkspace = context
    this.runtime = context.status === 'ready' ? createWorkspaceRuntime(context.path) : null
    return context
  }

  async init(): Promise<WorkspaceContextDto> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace selected.')
    }

    if (this.currentWorkspace.status === 'ready') {
      throw new Error(`Workspace is already initialized: ${this.currentWorkspace.configPath}`)
    }

    const runtime = createWorkspaceRuntime(this.currentWorkspace.path)
    await runtime.desiredStateRepository.save(createDefaultConfig())

    const readyWorkspace = {
      ...this.currentWorkspace,
      status: 'ready' as const,
      isOpen: true,
    }

    this.currentWorkspace = readyWorkspace
    this.runtime = createWorkspaceRuntime(readyWorkspace.path)
    return readyWorkspace
  }

  async attach(toolName: string, clientName: string): Promise<SyncPlan> {
    this.ensureReadyWorkspace()
    return this.ensureRuntime().workspaceService.attach(toolName, clientName)
  }

  async detach(toolName: string, clientName: string): Promise<SyncPlan> {
    this.ensureReadyWorkspace()
    return this.ensureRuntime().workspaceService.detach(toolName, clientName)
  }

  async plan(clientName: string): Promise<SyncPlan> {
    this.ensureReadyWorkspace()
    return this.ensureRuntime().workspaceService.plan(clientName)
  }

  async sync(clientName: string): Promise<SyncPlan> {
    this.ensureReadyWorkspace()
    return this.ensureRuntime().workspaceService.sync(clientName)
  }

  async addMcp(toolName: string, options?: { command?: string; args?: string[]; env?: Record<string, string>; package?: string }): Promise<WorkspaceStatusDto> {
    this.ensureReadyWorkspace()
    await this.ensureRuntime().mcpRegistryService.add(toolName, options)
    return this.status()
  }

  async updateMcp(
    toolName: string,
    nextToolName: string,
    options?: { command?: string; args?: string[]; env?: Record<string, string>; package?: string },
  ): Promise<WorkspaceStatusDto> {
    this.ensureReadyWorkspace()
    await this.ensureRuntime().mcpRegistryService.update(toolName, nextToolName, options)
    return this.status()
  }

  async removeMcp(toolName: string): Promise<WorkspaceStatusDto> {
    this.ensureReadyWorkspace()
    await this.ensureRuntime().mcpRegistryService.remove(toolName)
    return this.status()
  }

  async status(): Promise<WorkspaceStatusDto> {
    if (!this.currentWorkspace) {
      return {
        workspace: null,
        clients: [],
        tools: [],
        outOfSyncCount: 0,
        inSyncCount: 0,
      }
    }

    if (this.currentWorkspace.status === 'not_initialized') {
      return {
        workspace: this.currentWorkspace,
        clients: [],
        tools: [],
        outOfSyncCount: 0,
        inSyncCount: 0,
      }
    }

    const runtime = this.ensureRuntime()
    const workspaceStatus = await runtime.workspaceService.status()
    const clients = workspaceStatus.clients.map(mapClientStatus)
    const outOfSyncCount = clients.filter((client) => client.outOfSync).length

    return {
      workspace: this.currentWorkspace,
      clients,
      tools: mapMcpTools(workspaceStatus.desiredState),
      outOfSyncCount,
      inSyncCount: clients.length - outOfSyncCount,
    }
  }

  private ensureReadyWorkspace(): WorkspaceContextDto {
    if (!this.currentWorkspace) {
      throw new Error('No workspace selected.')
    }

    if (this.currentWorkspace.status !== 'ready') {
      throw new Error('Workspace is not initialized.')
    }

    return this.currentWorkspace
  }

  private ensureRuntime(): WorkspaceRuntime {
    if (!this.currentWorkspace) {
      throw new Error('No workspace selected.')
    }

    if (!this.runtime || this.runtime.workspacePath !== this.currentWorkspace.path) {
      this.runtime = createWorkspaceRuntime(this.currentWorkspace.path)
    }

    return this.runtime
  }
}
