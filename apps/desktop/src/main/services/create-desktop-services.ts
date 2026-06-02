import { WorkspaceSession } from './workspace-session.js'

export type DesktopServices = {
  workspaceSession: WorkspaceSession
}

export const createDesktopServices = (): DesktopServices => ({
  workspaceSession: new WorkspaceSession(),
})
