import type {
  ClientId,
  IpcResult,
  SyncPlanDto,
  WorkspaceContextDto,
  WorkspaceStatusDto,
} from '../../shared/dtos.js'
import type { WorkspaceMcpAddOptions } from '../../main/ipc/types.js'

declare global {
  interface Window {
    mcpspace: {
      workspace: {
        open(): Promise<IpcResult<WorkspaceContextDto | null>>
        openPath(path: string): Promise<IpcResult<WorkspaceContextDto | null>>
        init(): Promise<IpcResult<WorkspaceContextDto>>
        current(): Promise<IpcResult<WorkspaceContextDto | null>>
        status(): Promise<IpcResult<WorkspaceStatusDto>>
        attach(toolName: string, client: ClientId): Promise<IpcResult<SyncPlanDto>>
        detach(toolName: string, client: ClientId): Promise<IpcResult<SyncPlanDto>>
        plan(client: ClientId): Promise<IpcResult<SyncPlanDto>>
        sync(client: ClientId): Promise<IpcResult<SyncPlanDto>>
        mcpAdd(toolName: string, options: WorkspaceMcpAddOptions): Promise<IpcResult<WorkspaceStatusDto>>
        mcpUpdate(toolName: string, nextToolName: string, options: WorkspaceMcpAddOptions): Promise<IpcResult<WorkspaceStatusDto>>
        mcpRemove(toolName: string): Promise<IpcResult<WorkspaceStatusDto>>
        copyPath(path: string): Promise<IpcResult<void>>
        openInExplorer(path: string): Promise<IpcResult<void>>
      }
    }
  }
}

export {}
