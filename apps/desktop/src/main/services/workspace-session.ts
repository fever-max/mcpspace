import { existsSync } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, resolve } from 'node:path'
import { parse as parseYaml } from 'yaml'

import {
  FileAtomicWriter,
  FileConfigLoader,
  FileStateRepository,
  type ConfigLoader,
  McpspaceConfigSchema,
  type McpspaceConfig,
  type PathResolver,
  type StateRepository,
} from '@mcpspace/core'
import {
  type AdapterFactory,
  type AdapterName,
  type ClientAdapter,
  ClaudeCodeAdapter,
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
import { MCP_CATALOG } from '@mcpspace/workspace'

import {
  type ClientId,
  type ClientStatusKind,
  type ClientStatusDto,
  type McpCatalogEntryDto,
  type McpCatalogListDto,
  type McpConfigDto,
  type WorkspaceDoctorDto,
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
  pathResolver: PathResolver
  configLoader: ConfigLoader
  stateRepository: StateRepository
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
      `Unsupported client '${client}'. Use: claude-code, codex, cursor`,
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
    pathResolver,
    configLoader,
    stateRepository,
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

const doctorClientOrder: ClientId[] = ['codex', 'claude-code', 'cursor']

const getClientConfigPath = (workspacePath: string, client: ClientId): string => {
  if (client === 'codex') {
    return resolve(workspacePath, '.codex', 'config.toml')
  }

  if (client === 'claude-code') {
    return resolve(workspacePath, '.mcp.json')
  }

  return resolve(workspacePath, '.cursor', 'mcp.json')
}

const getLatestTimestamp = (timestamps: Iterable<string>): string | null => {
  const sorted = Array.from(timestamps)
    .filter((value) => value.length > 0)
    .sort((left, right) => right.localeCompare(left))

  return sorted[0] ?? null
}

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
): ClientStatusDto => {
  const statusKind: ClientStatusKind = status.outOfSync
    ? 'out_of_sync'
    : status.desiredTools.length === 0 && status.actualTools.length === 0
      ? 'not_configured'
      : 'in_sync'

  return {
    clientName: status.clientName as ClientId,
    statusKind,
    outOfSync: status.outOfSync,
    error: status.error,
    assignedMcpCount: status.desiredTools.length,
  }
}

export class WorkspaceSession {
  private currentWorkspace: WorkspaceContextDto | null = null
  private runtime: WorkspaceRuntime | null = null
  private mutationQueue: Promise<void> = Promise.resolve()

  private runSerialized<T>(task: () => Promise<T>): Promise<T> {
    const run = this.mutationQueue.then(task, task)
    this.mutationQueue = run.then(
      () => undefined,
      () => undefined,
    )
    return run
  }

  current(): WorkspaceContextDto | null {
    return this.currentWorkspace
  }

  async open(workspacePath: string): Promise<WorkspaceContextDto> {
    return this.runSerialized(async () => {
      const context = toWorkspaceContext(
        workspacePath,
        existsSync(resolve(workspacePath, '.mcpspace', 'config.yaml')) ? 'ready' : 'not_initialized',
      )

      this.currentWorkspace = context
      this.runtime = context.status === 'ready' ? createWorkspaceRuntime(context.path) : null
      return context
    })
  }

  async init(): Promise<WorkspaceContextDto> {
    return this.runSerialized(async () => {
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
      this.runtime = runtime
      return readyWorkspace
    })
  }

  async attach(toolName: string, clientName: string): Promise<SyncPlan> {
    return this.runSerialized(async () => {
      this.ensureReadyWorkspace()
      return this.ensureRuntime().workspaceService.attach(toolName, clientName)
    })
  }

  async detach(toolName: string, clientName: string): Promise<SyncPlan> {
    return this.runSerialized(async () => {
      this.ensureReadyWorkspace()
      return this.ensureRuntime().workspaceService.detach(toolName, clientName)
    })
  }

  async plan(clientName: string): Promise<SyncPlan> {
    this.ensureReadyWorkspace()
    return this.ensureRuntime().workspaceService.plan(clientName)
  }

  async sync(clientName: string, options: { backup?: boolean } = {}): Promise<SyncPlan> {
    return this.runSerialized(async () => {
      this.ensureReadyWorkspace()
      return this.ensureRuntime().workspaceService.sync(clientName, options)
    })
  }

  async addMcp(toolName: string, options?: { command?: string; args?: string[]; env?: Record<string, string>; package?: string }): Promise<WorkspaceStatusDto> {
    return this.runSerialized(async () => {
      this.ensureReadyWorkspace()
      await this.ensureRuntime().mcpRegistryService.add(toolName, options)
      return this.status()
    })
  }

  async updateMcp(
    toolName: string,
    nextToolName: string,
    options?: { command?: string; args?: string[]; env?: Record<string, string>; package?: string },
  ): Promise<WorkspaceStatusDto> {
    return this.runSerialized(async () => {
      this.ensureReadyWorkspace()
      await this.ensureRuntime().mcpRegistryService.update(toolName, nextToolName, options)
      return this.status()
    })
  }

  async removeMcp(toolName: string): Promise<WorkspaceStatusDto> {
    return this.runSerialized(async () => {
      this.ensureReadyWorkspace()
      await this.ensureRuntime().mcpRegistryService.remove(toolName)
      return this.status()
    })
  }

  async status(): Promise<WorkspaceStatusDto> {
    if (!this.currentWorkspace) {
      return {
        workspace: null,
        clients: [],
        tools: [],
        outOfSyncCount: 0,
        inSyncCount: 0,
        notConfiguredCount: 0,
      }
    }

    if (this.currentWorkspace.status === 'not_initialized') {
      return {
        workspace: this.currentWorkspace,
        clients: [],
        tools: [],
        outOfSyncCount: 0,
        inSyncCount: 0,
        notConfiguredCount: 0,
      }
    }

    const runtime = this.ensureRuntime()
    const workspaceStatus = await runtime.workspaceService.status()
    const clients = workspaceStatus.clients.map(mapClientStatus)
    const outOfSyncCount = clients.filter((client) => client.statusKind === 'out_of_sync').length
    const inSyncCount = clients.filter((client) => client.statusKind === 'in_sync').length
    const notConfiguredCount = clients.filter((client) => client.statusKind === 'not_configured').length

    return {
      workspace: this.currentWorkspace,
      clients,
      tools: mapMcpTools(workspaceStatus.desiredState),
      outOfSyncCount,
      inSyncCount,
      notConfiguredCount,
    }
  }

  async doctor(): Promise<WorkspaceDoctorDto> {
    if (!this.currentWorkspace) {
      throw new Error('No workspace selected.')
    }

    const workspace = this.currentWorkspace
    const runtime = workspace.status === 'ready'
      ? this.ensureRuntime()
      : createWorkspaceRuntime(workspace.path)
    const warnings: WorkspaceDoctorDto['warnings'] = []
    const lastCheckedAt = new Date().toISOString()
    const state = await runtime.stateRepository.load()
    const lastSyncAt = getLatestTimestamp(Object.values(state.lastSync))

    const configPath = workspace.configPath
    const configExists = existsSync(configPath)
    let configReadable = false
    let parseValid = false
    let parsedConfig: unknown = null
    let parseMessage = 'Config file not found.'

    if (configExists) {
      try {
        const rawConfig = await readFile(configPath, 'utf-8')
        configReadable = true
        parsedConfig = parseYaml(rawConfig)
        parseValid = true
        parseMessage = 'Config file is valid YAML.'
      } catch (error) {
        parseMessage = error instanceof Error ? error.message : 'Failed to read config file.'
      }
    }

    const configCheck: WorkspaceDoctorDto['configCheck'] = {
      status: !configExists ? 'warning' : configReadable && parseValid ? 'healthy' : 'error',
      path: configPath,
      exists: configExists,
      readable: configReadable,
      parseValid,
      message: parseMessage,
    }

    if (!configExists) {
      warnings.push({
        level: 'warning',
        source: 'config',
        message: `${basename(configPath)} was not found.`,
      })
    } else if (!configReadable || !parseValid) {
      warnings.push({
        level: 'error',
        source: 'config',
        message: parseMessage,
      })
    }

    const validation = parseValid ? McpspaceConfigSchema.safeParse(parsedConfig) : null
    const validationErrors = validation && !validation.success
      ? validation.error.issues.map((issue) => issue.message)
      : []

    const validationCheck: WorkspaceDoctorDto['validationCheck'] = validation?.success
      ? {
          status: 'healthy',
          valid: true,
          errors: [],
          message: 'Configuration schema is valid.',
        }
      : {
          status: configExists ? 'error' : 'warning',
          valid: false,
          errors: validationErrors,
          message: configExists
            ? validationErrors[0] ?? 'Configuration schema validation failed.'
            : 'Config file is missing, so schema validation could not run.',
        }

    if (!validationCheck.valid) {
      warnings.push({
        level: configExists ? 'error' : 'warning',
        source: 'validation',
        message: validationCheck.message,
      })
    }

    let workspaceStatus: WorkspaceStatusDto | null = null
    if (workspace.status === 'ready' && validation?.success) {
      try {
        workspaceStatus = await this.status()
      } catch (error) {
        warnings.push({
          level: 'error',
          source: 'sync',
          message: error instanceof Error ? error.message : 'Failed to load workspace status.',
        })
      }
    }

    const syncCheck: WorkspaceDoctorDto['syncCheck'] = workspaceStatus
      ? {
          status: workspaceStatus.outOfSyncCount > 0 ? 'warning' : 'healthy',
          outOfSyncCount: workspaceStatus.outOfSyncCount,
          lastSyncAt,
          message: workspaceStatus.outOfSyncCount > 0
            ? `${workspaceStatus.outOfSyncCount} client(s) are out of sync.`
            : 'All clients are in sync with the desired state.',
        }
      : {
          status: workspace.status === 'ready' ? 'warning' : 'warning',
          outOfSyncCount: 0,
          lastSyncAt,
          message: workspace.status === 'ready'
            ? 'Sync status could not be evaluated.'
            : 'Initialize the workspace to evaluate sync status.',
        }

    if (workspaceStatus && workspaceStatus.outOfSyncCount > 0) {
      warnings.push({
        level: 'warning',
        source: 'sync',
        message: `${workspaceStatus.outOfSyncCount} client(s) are out of sync.`,
      })
    }

    const desiredState = validation?.success ? validation.data : createDefaultConfig()
    const adapters: WorkspaceDoctorDto['adapters'] = doctorClientOrder.map((client) => {
      const toolCount = desiredState.clients[client]?.mcps.length ?? 0
      const clientConfigPath = getClientConfigPath(workspace.path, client)
      const configExistsForClient = existsSync(clientConfigPath)

      let status: WorkspaceDoctorDto['adapters'][number]['status'] = 'healthy'
      let message = 'Client config file exists.'

      if (!configExistsForClient && toolCount > 0) {
        status = 'warning'
        message = 'Client config file is missing.'
        warnings.push({
          level: 'warning',
          source: client,
          message: `${client} config file was not found.`,
        })
      } else if (!configExistsForClient) {
        status = 'not_detected'
        message = 'Client config file was not detected.'
      }

      return {
        client,
        status,
        toolCount,
        configExists: configExistsForClient,
        configPath: clientConfigPath,
        message,
      }
    })

    const backupDir = runtime.pathResolver.getBackupDir()
    let backupCount = 0
    let backupItems: Array<{ name: string; createdAt: string }> = []

    if (existsSync(backupDir)) {
      const entries = await readdir(backupDir)
      const withStats = await Promise.all(
        entries.map(async (name) => {
          const path = resolve(backupDir, name)
          const entryStats = await stat(path)
          return entryStats.isFile()
            ? { name, createdAt: entryStats.mtime.toISOString() }
            : null
        }),
      )

      backupItems = withStats
        .filter((entry): entry is { name: string; createdAt: string } => entry !== null)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      backupCount = backupItems.length
      backupItems = backupItems.slice(0, 3)
    }

    const backupSummary: WorkspaceDoctorDto['backupSummary'] = {
      status: backupCount > 0 ? 'healthy' : 'warning',
      lastBackupAt: backupItems[0]?.createdAt ?? null,
      backupCount,
      backupDir,
      message: backupCount > 0
        ? `${backupCount} backup(s) available.`
        : 'No backups found yet.',
      items: backupItems,
    }

    if (backupCount === 0) {
      warnings.push({
        level: 'warning',
        source: 'backup',
        message: 'No backups were found.',
      })
    }

    const overallStatus: WorkspaceDoctorDto['overall']['status'] = warnings.some((warning) => warning.level === 'error')
      ? 'error'
      : warnings.length > 0
        ? 'warning'
        : 'healthy'

    const overallMessage = overallStatus === 'healthy'
      ? 'No issues detected.'
      : overallStatus === 'error'
        ? 'Errors were found that need attention.'
        : 'Warnings were found that should be reviewed.'

    return {
      overall: {
        status: overallStatus,
        lastCheckedAt,
        workspaceName: workspace.name,
        lastSyncAt,
        message: overallMessage,
      },
      configCheck,
      validationCheck,
      syncCheck,
      adapters,
      backupSummary,
      warnings,
    }
  }

  async catalogList(): Promise<McpCatalogListDto> {
    const registeredTools = new Set<string>()

    if (this.currentWorkspace?.status === 'ready') {
      const config = await this.ensureRuntime().configLoader.loadProjectConfig()
      for (const toolName of Object.keys(config.mcps)) {
        registeredTools.add(toolName)
      }
    }

    const items: McpCatalogEntryDto[] = Object.entries(MCP_CATALOG)
      .map(([toolName, entry]) => ({
        toolName,
        package: entry.package,
        command: entry.command,
        args: [...entry.args],
        env: { ...entry.env },
        description: entry.description,
        isRegistered: registeredTools.has(toolName),
      }))
      .sort((a, b) => a.toolName.localeCompare(b.toolName))

    return { items }
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
