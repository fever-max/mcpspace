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

export type ClientStatusDto = {
  clientName: ClientId
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
}
