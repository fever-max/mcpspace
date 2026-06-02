import { contextBridge, ipcRenderer } from 'electron'

import { IPC_CHANNELS } from '../main/ipc/channels.js'

const api = {
  workspace: {
    current: () => ipcRenderer.invoke(IPC_CHANNELS.workspace.current),
  },
}

contextBridge.exposeInMainWorld('mcpspace', api)
