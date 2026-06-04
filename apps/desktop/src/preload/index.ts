import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS } from '../main/ipc/channels.js'

const api = {
  workspace: {
    open: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.open),
    init: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.init),
    current: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.current),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.status),
  },
}

contextBridge.exposeInMainWorld('mcpspace', api)
