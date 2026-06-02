import type { WorkspaceContextDto } from '../../shared/dtos.js'

export class WorkspaceSession {
  private currentWorkspace: WorkspaceContextDto | null = null

  current(): WorkspaceContextDto | null {
    return this.currentWorkspace
  }
}
