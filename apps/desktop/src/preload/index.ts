import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS } from '../main/ipc/channels.js'

const api = {
  workspace: {
    open: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.open),
    init: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.init),
    current: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.current),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.status),
    attach: (toolName: string, clientName: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.attach, toolName, clientName),
    detach: (toolName: string, clientName: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.detach, toolName, clientName),
    plan: (clientName: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.plan, clientName),
    sync: (clientName: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.sync, clientName),
    mcpAdd: (toolName: string, options: unknown) => ipcRenderer.invoke(IPC_CHANNELS.workspace.mcpAdd, toolName, options),
    mcpUpdate: (toolName: string, nextToolName: string, options: unknown) =>
      ipcRenderer.invoke(IPC_CHANNELS.workspace.mcpUpdate, toolName, nextToolName, options),
    mcpRemove: (toolName: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.mcpRemove, toolName),
    copyPath: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.copyPath, path),
    openInExplorer: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.openInExplorer, path),
  },
}

contextBridge.exposeInMainWorld('mcpspace', api)
