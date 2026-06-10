import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS } from '../main/ipc/channels.js'
import type { WorkspaceMcpAddOptions } from '../main/ipc/types.js'
import type {
  ClientId,
  IpcResult,
  McpCatalogListDto,
  SyncPlanDto,
  WorkspaceContextDto,
  WorkspaceDoctorDto,
  WorkspaceStatusDto,
} from '../shared/dtos.js'

const api = {
  workspace: {
    open: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.open),
    openPath: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.openPath, path),
    init: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.init),
    current: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.current),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.status),
    doctor: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.doctor),
    attach: (toolName: string, clientName: ClientId) =>
      ipcRenderer.invoke(IPC_CHANNELS.workspace.attach, toolName, clientName),
    detach: (toolName: string, clientName: ClientId) =>
      ipcRenderer.invoke(IPC_CHANNELS.workspace.detach, toolName, clientName),
    plan: (clientName: ClientId) => ipcRenderer.invoke(IPC_CHANNELS.workspace.plan, clientName),
    sync: (clientName: ClientId, options?: { backup?: boolean }) => ipcRenderer.invoke(IPC_CHANNELS.workspace.sync, clientName, options ?? {}),
    mcpAdd: (toolName: string, options: WorkspaceMcpAddOptions) =>
      ipcRenderer.invoke(IPC_CHANNELS.workspace.mcpAdd, toolName, options),
    mcpUpdate: (toolName: string, nextToolName: string, options: WorkspaceMcpAddOptions) =>
      ipcRenderer.invoke(IPC_CHANNELS.workspace.mcpUpdate, toolName, nextToolName, options),
    mcpRemove: (toolName: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.mcpRemove, toolName),
    catalogList: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.catalogList),
    copyPath: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.copyPath, path),
    openInExplorer: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.openInExplorer, path),
  },
}

type DesktopApi = {
  workspace: {
    open(): Promise<IpcResult<WorkspaceContextDto | null>>
    openPath(path: string): Promise<IpcResult<WorkspaceContextDto | null>>
    init(): Promise<IpcResult<WorkspaceContextDto>>
    current(): Promise<IpcResult<WorkspaceContextDto | null>>
    status(): Promise<IpcResult<WorkspaceStatusDto>>
    doctor(): Promise<IpcResult<WorkspaceDoctorDto>>
    attach(toolName: string, clientName: ClientId): Promise<IpcResult<SyncPlanDto>>
    detach(toolName: string, clientName: ClientId): Promise<IpcResult<SyncPlanDto>>
    plan(clientName: ClientId): Promise<IpcResult<SyncPlanDto>>
    sync(clientName: ClientId, options?: { backup?: boolean }): Promise<IpcResult<SyncPlanDto>>
    mcpAdd(toolName: string, options: WorkspaceMcpAddOptions): Promise<IpcResult<WorkspaceStatusDto>>
    mcpUpdate(toolName: string, nextToolName: string, options: WorkspaceMcpAddOptions): Promise<IpcResult<WorkspaceStatusDto>>
    mcpRemove(toolName: string): Promise<IpcResult<WorkspaceStatusDto>>
    catalogList(): Promise<IpcResult<McpCatalogListDto>>
    copyPath(path: string): Promise<IpcResult<void>>
    openInExplorer(path: string): Promise<IpcResult<void>>
  }
}

contextBridge.exposeInMainWorld('mcpspace', api satisfies DesktopApi)
