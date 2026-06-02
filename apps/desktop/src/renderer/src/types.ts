import type { IpcResult, WorkspaceContextDto } from '../../shared/dtos.js'

declare global {
  interface Window {
    mcpspace: {
      workspace: {
        current(): Promise<IpcResult<WorkspaceContextDto | null>>
      }
    }
  }
}

export {}
