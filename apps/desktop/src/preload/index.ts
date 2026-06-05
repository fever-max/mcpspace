import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS } from '../main/ipc/channels.js'

const api = {
  workspace: {
    open: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.open),
    init: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.init),
    current: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.current),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.status),
    copyPath: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.copyPath, path),
    openInExplorer: (path: string) => ipcRenderer.invoke(IPC_CHANNELS.workspace.openInExplorer, path),
  },
}

contextBridge.exposeInMainWorld('mcpspace', api)
