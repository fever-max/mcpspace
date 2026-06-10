import { BrowserWindow, clipboard, dialog, shell, type IpcMain, type IpcMainInvokeEvent, type OpenDialogOptions } from 'electron'
import { stat } from 'node:fs/promises'

import { IPC_CHANNELS } from './channels.js'
import type {
  WorkspaceAttachDetachErrorCode,
  WorkspaceAttachResponse,
  WorkspaceCopyPathResponse,
  WorkspaceCurrentResponse,
  WorkspaceDoctorResponse,
  WorkspaceDetachResponse,
  WorkspaceMcpAddOptions,
  WorkspaceMcpMutationErrorCode,
  WorkspaceMcpMutationResponse,
  WorkspaceMcpUpdateResponse,
  WorkspaceInitErrorCode,
  WorkspaceInitResponse,
  WorkspacePlanErrorCode,
  WorkspacePlanResponse,
  WorkspaceSyncErrorCode,
  WorkspaceSyncResponse,
  WorkspaceOpenErrorCode,
  WorkspaceOpenPathResponse,
  WorkspaceOpenInExplorerResponse,
  WorkspaceOpenResponse,
  WorkspaceStatusErrorCode,
  WorkspaceStatusResponse,
  WorkspaceCatalogListResponse,
} from './types.js'
import type { SyncPlanDto } from '../../shared/dtos.js'
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

const toDoctorError = (error: unknown): 'WORKSPACE_NOT_OPEN' | 'UNKNOWN_ERROR' => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (message.includes('No workspace selected.')) return 'WORKSPACE_NOT_OPEN'
  return 'UNKNOWN_ERROR'
}

const toAttachDetachError = (error: unknown): WorkspaceAttachDetachErrorCode => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (message.includes('No workspace selected.')) return 'WORKSPACE_NOT_OPEN'
  if (message.includes('Workspace is not initialized.')) return 'WORKSPACE_NOT_INITIALIZED'
  if (message.includes('is not registered')) return 'TOOL_NOT_FOUND'
  return 'UNKNOWN_ERROR'
}

const toPlanError = (error: unknown): WorkspacePlanErrorCode => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (message.includes('No workspace selected.')) return 'WORKSPACE_NOT_OPEN'
  if (message.includes('Workspace is not initialized.')) return 'WORKSPACE_NOT_INITIALIZED'
  return 'UNKNOWN_ERROR'
}

const toSyncError = (error: unknown): WorkspaceSyncErrorCode => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (message.includes('No workspace selected.')) return 'WORKSPACE_NOT_OPEN'
  if (message.includes('Workspace is not initialized.')) return 'WORKSPACE_NOT_INITIALIZED'
  if (message.includes('is not detected')) return 'CLIENT_NOT_DETECTED'
  if (message.toLowerCase().includes('validation failed')) return 'VALIDATION_FAILED'
  if (message.toLowerCase().includes('restore')) return 'RESTORE_FAILED'
  return 'UNKNOWN_ERROR'
}

const toMcpMutationError = (error: unknown): WorkspaceMcpMutationErrorCode => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  if (message.includes('No workspace selected.')) return 'WORKSPACE_NOT_OPEN'
  if (message.includes('Workspace is not initialized.')) return 'WORKSPACE_NOT_INITIALIZED'
  if (message.includes('already registered')) return 'MCP_ALREADY_EXISTS'
  if (message.includes('not registered')) return 'MCP_NOT_FOUND'
  if (message.includes('assigned to')) return 'MCP_ASSIGNED'
  return 'UNKNOWN_ERROR'
}

const mapPlanActionType = (type: string): SyncPlanDto['actions'][number]['type'] => {
  if (type === 'create' || type === 'update' || type === 'delete' || type === 'noop') {
    return type
  }

  return 'noop'
}

const mapSyncPlan = (plan: {
  clientName: string
  actions: Array<{
    type: string
    toolName: string
    reasonCode: string
    reason: string
    desiredEntry?: {
      command: string
      args: string[]
      env?: Record<string, string>
    }
    actualEntry?: {
      command: string
      args: string[]
      env?: Record<string, string>
    }
  }>
  summary: {
    create: number
    update: number
    delete: number
    noop: number
  }
}): SyncPlanDto => ({
  clientName: plan.clientName as SyncPlanDto['clientName'],
  actions: plan.actions.map((action) => ({
    type: mapPlanActionType(action.type),
    toolName: action.toolName,
    reasonCode: action.reasonCode,
    reason: action.reason,
    desiredEntry: action.desiredEntry
      ? {
          command: action.desiredEntry.command,
          args: [...action.desiredEntry.args],
          env: { ...(action.desiredEntry.env ?? {}) },
        }
      : undefined,
    actualEntry: action.actualEntry
      ? {
          command: action.actualEntry.command,
          args: [...action.actualEntry.args],
          env: { ...(action.actualEntry.env ?? {}) },
        }
      : undefined,
  })),
  summary: {
    create: plan.summary.create,
    update: plan.summary.update,
    delete: plan.summary.delete,
    noop: plan.summary.noop,
  },
})

const getWindow = (event: IpcMainInvokeEvent) => BrowserWindow.fromWebContents(event.sender) ?? undefined

const isDirectoryPath = async (path: string): Promise<boolean> => {
  try {
    const stats = await stat(path)
    return stats.isDirectory()
  } catch {
    return false
  }
}

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

  ipcMain.handle(IPC_CHANNELS.workspace.openPath, async (_event, workspacePath: string): Promise<WorkspaceOpenPathResponse> => {
    try {
      if (!workspacePath || !(await isDirectoryPath(workspacePath))) {
        return fail('WORKSPACE_NOT_FOUND', `Workspace path not found: ${workspacePath}`)
      }

      const workspace = await services.workspaceSession.open(workspacePath)
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

  ipcMain.handle(IPC_CHANNELS.workspace.doctor, async (): Promise<WorkspaceDoctorResponse> => {
    try {
      const doctor = await services.workspaceSession.doctor()
      return ok(doctor)
    } catch (error) {
      return fail(toDoctorError(error), error instanceof Error ? error.message : 'Unknown error')
    }
  })


  ipcMain.handle(IPC_CHANNELS.workspace.attach, async (_event, toolName: string, clientName: string): Promise<WorkspaceAttachResponse> => {
    try {
      const plan = await services.workspaceSession.attach(toolName, clientName)
      return ok(mapSyncPlan(plan))
    } catch (error) {
      return fail(toAttachDetachError(error), error instanceof Error ? error.message : 'Unknown error')
    }
  })

  ipcMain.handle(IPC_CHANNELS.workspace.detach, async (_event, toolName: string, clientName: string): Promise<WorkspaceDetachResponse> => {
    try {
      const plan = await services.workspaceSession.detach(toolName, clientName)
      return ok(mapSyncPlan(plan))
    } catch (error) {
      return fail(toAttachDetachError(error), error instanceof Error ? error.message : 'Unknown error')
    }
  })

  ipcMain.handle(IPC_CHANNELS.workspace.plan, async (_event, clientName: string): Promise<WorkspacePlanResponse> => {
    try {
      const plan = await services.workspaceSession.plan(clientName)
      return ok(mapSyncPlan(plan))
    } catch (error) {
      return fail(toPlanError(error), error instanceof Error ? error.message : 'Unknown error')
    }
  })

  ipcMain.handle(IPC_CHANNELS.workspace.sync, async (_event, clientName: string, options: { backup?: boolean } = {}): Promise<WorkspaceSyncResponse> => {
    try {
      const plan = await services.workspaceSession.sync(clientName, options)
      return ok(mapSyncPlan(plan))
    } catch (error) {
      return fail(toSyncError(error), error instanceof Error ? error.message : 'Unknown error')
    }
  })

  ipcMain.handle(
    IPC_CHANNELS.workspace.mcpAdd,
    async (_event, toolName: string, options: WorkspaceMcpAddOptions): Promise<WorkspaceMcpMutationResponse> => {
    try {
      const status = await services.workspaceSession.addMcp(toolName, options)
      return ok(status)
    } catch (error) {
      return fail(toMcpMutationError(error), error instanceof Error ? error.message : 'Unknown error')
    }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.workspace.mcpUpdate,
    async (
      _event,
      toolName: string,
      nextToolName: string,
      options: WorkspaceMcpAddOptions,
    ): Promise<WorkspaceMcpUpdateResponse> => {
      try {
        const status = await services.workspaceSession.updateMcp(toolName, nextToolName, options)
        return ok(status)
      } catch (error) {
        return fail(toMcpMutationError(error), error instanceof Error ? error.message : 'Unknown error')
      }
    },
  )

  ipcMain.handle(
    IPC_CHANNELS.workspace.mcpRemove,
    async (_event, toolName: string): Promise<WorkspaceMcpMutationResponse> => {
    try {
      const status = await services.workspaceSession.removeMcp(toolName)
      return ok(status)
    } catch (error) {
      return fail(toMcpMutationError(error), error instanceof Error ? error.message : 'Unknown error')
    }
    },
  )

  ipcMain.handle(IPC_CHANNELS.workspace.catalogList, async (): Promise<WorkspaceCatalogListResponse> => {
    try {
      const catalog = await services.workspaceSession.catalogList()
      return ok(catalog)
    } catch (error) {
      return fail('UNKNOWN_ERROR', error instanceof Error ? error.message : 'Unknown error')
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
