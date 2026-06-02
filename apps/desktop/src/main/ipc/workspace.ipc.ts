import type { IpcMain } from 'electron'

import { IPC_CHANNELS } from './channels.js'
import type { WorkspaceCurrentResponse } from './types.js'
import type { DesktopServices } from '../services/create-desktop-services.js'

const ok = <T>(data: T) => ({ ok: true as const, data })

export const registerWorkspaceCurrentIpc = (services: DesktopServices, ipcMain: IpcMain): void => {
  ipcMain.handle(IPC_CHANNELS.workspace.current, async (): Promise<WorkspaceCurrentResponse> => ok(services.workspaceSession.current()))
}
