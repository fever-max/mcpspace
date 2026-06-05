import { BrowserWindow, clipboard, dialog, shell, type IpcMain, type IpcMainInvokeEvent, type OpenDialogOptions } from 'electron'

import { IPC_CHANNELS } from './channels.js'
import type {
  WorkspaceCopyPathResponse,
  WorkspaceCurrentResponse,
  WorkspaceInitErrorCode,
  WorkspaceInitResponse,
  WorkspaceOpenErrorCode,
  WorkspaceOpenInExplorerResponse,
  WorkspaceOpenResponse,
  WorkspaceStatusErrorCode,
  WorkspaceStatusResponse,
} from './types.js'
import type { DesktopServices } from '../services/create-desktop-services.js'

const ok = <T>(data: T) => ({ ok: true as const, data })

const fail = <Code extends string>(code: Code, message: string, details?: unknown) => ({
  ok: false as const,
  error: { code, message, details },
})

const toOpenError = (error: unknown): WorkspaceOpenErrorCode => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (message.toLowerCase().includes('permission')) return 'PERMISSION_DENIED'
  if (message.toLowerCase().includes('not found')) return 'WORKSPACE_NOT_FOUND'
  return 'UNKNOWN_ERROR'
}

const toInitError = (error: unknown): WorkspaceInitErrorCode => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (message.includes('No workspace selected.')) return 'WORKSPACE_NOT_OPEN'
  if (message.includes('already initialized')) return 'WORKSPACE_ALREADY_INITIALIZED'
  if (message.toLowerCase().includes('permission')) return 'PERMISSION_DENIED'
  return 'UNKNOWN_ERROR'
}

const toStatusError = (error: unknown): WorkspaceStatusErrorCode => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (message.includes('No workspace selected.')) return 'WORKSPACE_NOT_OPEN'
  if (message.toLowerCase().includes('validation failed')) return 'VALIDATION_FAILED'
  return 'UNKNOWN_ERROR'
}

const getWindow = (event: IpcMainInvokeEvent) => BrowserWindow.fromWebContents(event.sender) ?? undefined

export const registerWorkspaceIpc = (services: DesktopServices, ipcMain: IpcMain): void => {
  ipcMain.handle(IPC_CHANNELS.workspace.open, async (event): Promise<WorkspaceOpenResponse> => {
    try {
      const window = getWindow(event)
      const options: OpenDialogOptions = {
        properties: ['openDirectory'],
        title: 'Open Workspace',
      }
      const result = window ? await dialog.showOpenDialog(window, options) : await dialog.showOpenDialog(options)

      if (result.canceled || result.filePaths.length === 0) {
        return ok(services.workspaceSession.current())
      }

      const workspace = await services.workspaceSession.open(result.filePaths[0])
      return ok(workspace)
    } catch (error) {
      return fail(toOpenError(error), error instanceof Error ? error.message : 'Unknown error')
    }
  })

  ipcMain.handle(IPC_CHANNELS.workspace.init, async (): Promise<WorkspaceInitResponse> => {
    try {
      const workspace = await services.workspaceSession.init()
      return ok(workspace)
    } catch (error) {
      return fail(toInitError(error), error instanceof Error ? error.message : 'Unknown error')
    }
  })

  ipcMain.handle(IPC_CHANNELS.workspace.current, async (): Promise<WorkspaceCurrentResponse> =>
    ok(services.workspaceSession.current()),
  )

  ipcMain.handle(IPC_CHANNELS.workspace.status, async (): Promise<WorkspaceStatusResponse> => {
    try {
      const status = await services.workspaceSession.status()
      return ok(status)
    } catch (error) {
      return fail(toStatusError(error), error instanceof Error ? error.message : 'Unknown error')
    }
  })

  ipcMain.handle(IPC_CHANNELS.workspace.copyPath, async (_event, path: string): Promise<WorkspaceCopyPathResponse> => {
    try {
      if (!path) {
        return fail('UNKNOWN_ERROR', 'Workspace path is required.')
      }

      clipboard.writeText(path)
      return ok(undefined)
    } catch (error) {
      return fail('UNKNOWN_ERROR', error instanceof Error ? error.message : 'Unknown error')
    }
  })

  ipcMain.handle(IPC_CHANNELS.workspace.openInExplorer, async (_event, path: string): Promise<WorkspaceOpenInExplorerResponse> => {
    try {
      if (!path) {
        return fail('UNKNOWN_ERROR', 'Workspace path is required.')
      }

      const result = await shell.openPath(path)
      if (result) {
        return fail('OPEN_IN_EXPLORER_FAILED', result)
      }

      return ok(undefined)
    } catch (error) {
      return fail('UNKNOWN_ERROR', error instanceof Error ? error.message : 'Unknown error')
    }
  })
}
