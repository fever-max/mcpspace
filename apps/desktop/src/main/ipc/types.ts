import type {
  IpcResult,
  McpCatalogListDto,
  SyncPlanDto,
  WorkspaceContextDto,
  WorkspaceStatusDto,
} from '../../shared/dtos.js'

export type WorkspaceOpenErrorCode =
  | 'WORKSPACE_NOT_FOUND'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN_ERROR'

export type WorkspaceInitErrorCode =
  | 'WORKSPACE_NOT_OPEN'
  | 'WORKSPACE_ALREADY_INITIALIZED'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN_ERROR'

export type WorkspaceCurrentErrorCode = 'UNKNOWN_ERROR'

export type WorkspaceStatusErrorCode =
  | 'WORKSPACE_NOT_OPEN'
  | 'VALIDATION_FAILED'
  | 'UNKNOWN_ERROR'

export type WorkspaceAttachDetachErrorCode =
  | 'WORKSPACE_NOT_OPEN'
  | 'WORKSPACE_NOT_INITIALIZED'
  | 'TOOL_NOT_FOUND'
  | 'UNKNOWN_ERROR'

export type WorkspacePlanErrorCode =
  | 'WORKSPACE_NOT_OPEN'
  | 'WORKSPACE_NOT_INITIALIZED'
  | 'UNKNOWN_ERROR'

export type WorkspaceSyncErrorCode =
  | 'WORKSPACE_NOT_OPEN'
  | 'WORKSPACE_NOT_INITIALIZED'
  | 'CLIENT_NOT_DETECTED'
  | 'VALIDATION_FAILED'
  | 'RESTORE_FAILED'
  | 'UNKNOWN_ERROR'

export type WorkspaceCopyPathErrorCode = 'UNKNOWN_ERROR'

export type WorkspaceCatalogListErrorCode = 'UNKNOWN_ERROR'

export type WorkspaceMcpMutationErrorCode =
  | 'WORKSPACE_NOT_OPEN'
  | 'WORKSPACE_NOT_INITIALIZED'
  | 'MCP_ALREADY_EXISTS'
  | 'MCP_NOT_FOUND'
  | 'MCP_ASSIGNED'
  | 'UNKNOWN_ERROR'

export type WorkspaceOpenInExplorerErrorCode =
  | 'OPEN_IN_EXPLORER_FAILED'
  | 'UNKNOWN_ERROR'

export type WorkspaceOpenResponse = IpcResult<WorkspaceContextDto | null, WorkspaceOpenErrorCode>
export type WorkspaceOpenPathResponse = WorkspaceOpenResponse
export type WorkspaceInitResponse = IpcResult<WorkspaceContextDto, WorkspaceInitErrorCode>
export type WorkspaceCurrentResponse = IpcResult<WorkspaceContextDto | null, WorkspaceCurrentErrorCode>
export type WorkspaceStatusResponse = IpcResult<WorkspaceStatusDto, WorkspaceStatusErrorCode>
export type WorkspaceAttachResponse = IpcResult<SyncPlanDto, WorkspaceAttachDetachErrorCode>
export type WorkspaceDetachResponse = IpcResult<SyncPlanDto, WorkspaceAttachDetachErrorCode>
export type WorkspacePlanResponse = IpcResult<SyncPlanDto, WorkspacePlanErrorCode>
export type WorkspaceSyncResponse = IpcResult<SyncPlanDto, WorkspaceSyncErrorCode>
export type WorkspaceCopyPathResponse = IpcResult<void, WorkspaceCopyPathErrorCode>
export type WorkspaceMcpAddOptions = {
  package?: string
  command: string
  args?: string[]
  env?: Record<string, string>
}
export type WorkspaceMcpMutationResponse = IpcResult<WorkspaceStatusDto, WorkspaceMcpMutationErrorCode>
export type WorkspaceMcpUpdateResponse = IpcResult<WorkspaceStatusDto, WorkspaceMcpMutationErrorCode>
export type WorkspaceCatalogListResponse = IpcResult<McpCatalogListDto, WorkspaceCatalogListErrorCode>
export type WorkspaceOpenInExplorerResponse = IpcResult<void, WorkspaceOpenInExplorerErrorCode>
