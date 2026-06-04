import type {
  IpcResult,
  WorkspaceContextDto,
  WorkspaceStatusDto,
} from '../../shared/dtos.js'

declare global {
  interface Window {
    mcpspace: {
      workspace: {
        open(): Promise<IpcResult<WorkspaceContextDto | null>>
        init(): Promise<IpcResult<WorkspaceContextDto>>
        current(): Promise<IpcResult<WorkspaceContextDto | null>>
        status(): Promise<IpcResult<WorkspaceStatusDto>>
      }
    }
  }
}

export {}
