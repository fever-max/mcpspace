import type {
  IpcResult,
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

export type WorkspaceOpenResponse = IpcResult<WorkspaceContextDto | null, WorkspaceOpenErrorCode>
export type WorkspaceInitResponse = IpcResult<WorkspaceContextDto, WorkspaceInitErrorCode>
export type WorkspaceCurrentResponse = IpcResult<WorkspaceContextDto | null, WorkspaceCurrentErrorCode>
export type WorkspaceStatusResponse = IpcResult<WorkspaceStatusDto, WorkspaceStatusErrorCode>
