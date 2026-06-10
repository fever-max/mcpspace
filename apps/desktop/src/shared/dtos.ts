export type ClientId = 'claude-code' | 'codex' | 'cursor'

export type WorkspaceContextStatus = 'not_initialized' | 'ready'

export type WorkspaceContextDto = {
  path: string
  name: string
  configPath: string
  status: WorkspaceContextStatus
  isOpen: boolean
}

export type IpcErrorDto<Code extends string = string> = {
  code: Code
  message: string
  details?: unknown
}

export type IpcSuccess<T> = {
  ok: true
  data: T
}

export type IpcFailure<Code extends string = string> = {
  ok: false
  error: IpcErrorDto<Code>
}

export type IpcResult<T, Code extends string = string> = IpcSuccess<T> | IpcFailure<Code>

export type ClientStatusKind = 'in_sync' | 'out_of_sync' | 'not_configured'

export type ClientStatusDto = {
  clientName: ClientId
  statusKind: ClientStatusKind
  outOfSync: boolean
  error?: string
  assignedMcpCount: number
}

export type McpConfigDto = {
  toolName: string
  package?: string
  command: string
  args: string[]
  env: Record<string, string>
  clients: ClientId[]
}

export type McpListDto = {
  items: McpConfigDto[]
}

export type McpCatalogEntryDto = {
  toolName: string
  package: string
  command: string
  args: string[]
  env: Record<string, string>
  description: string
  isRegistered: boolean
}

export type McpCatalogListDto = {
  items: McpCatalogEntryDto[]
}

export type PlanActionDto = {
  type: 'create' | 'update' | 'delete' | 'noop'
  toolName: string
  reasonCode: string
  reason: string
  desiredEntry?: {
    command: string
    args: string[]
    env: Record<string, string>
  }
  actualEntry?: {
    command: string
    args: string[]
    env: Record<string, string>
  }
}

export type SyncPlanDto = {
  clientName: ClientId
  actions: PlanActionDto[]
  summary: {
    create: number
    update: number
    delete: number
    noop: number
  }
}

export type WorkspaceStatusDto = {
  workspace: WorkspaceContextDto | null
  clients: ClientStatusDto[]
  tools: McpConfigDto[]
  outOfSyncCount: number
  inSyncCount: number
  notConfiguredCount: number
}

export type DoctorHealthStatus = 'healthy' | 'warning' | 'error'

export type DoctorAdapterStatus = 'healthy' | 'warning' | 'not_detected'

export type DoctorWarningLevel = 'warning' | 'error'

export type WorkspaceDoctorDto = {
  overall: {
    status: DoctorHealthStatus
    lastCheckedAt: string
    workspaceName: string
    lastSyncAt: string | null
    message: string
  }
  configCheck: {
    status: DoctorHealthStatus
    path: string
    exists: boolean
    readable: boolean
    parseValid: boolean
    message: string
  }
  validationCheck: {
    status: DoctorHealthStatus
    valid: boolean
    errors: string[]
    message: string
  }
  syncCheck: {
    status: DoctorHealthStatus
    outOfSyncCount: number
    lastSyncAt: string | null
    message: string
  }
  adapters: Array<{
    client: ClientId
    status: DoctorAdapterStatus
    toolCount: number
    configExists: boolean
    configPath: string
    message: string
  }>
  backupSummary: {
    status: DoctorHealthStatus
    lastBackupAt: string | null
    backupCount: number
    backupDir: string
    message: string
    items: Array<{
      name: string
      createdAt: string
    }>
  }
  warnings: Array<{
    level: DoctorWarningLevel
    source: string
    message: string
  }>
}
