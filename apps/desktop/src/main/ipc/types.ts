import type { IpcResult, WorkspaceContextDto } from '../../shared/dtos.js'

export type WorkspaceCurrentResponse = IpcResult<WorkspaceContextDto | null>
