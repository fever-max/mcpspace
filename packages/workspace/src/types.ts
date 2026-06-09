import type { McpspaceConfig, StateModel } from '@mcpspace/core'
import type { ActualState } from '@mcpspace/shared'

export type ClientStatusView = {
  clientName: string
  detected: boolean
  desiredTools: string[]
  actualTools: string[]
  lastAppliedTools: string[]
  outOfSync: boolean
  error?: string
}

export type WorkspaceStatus = {
  clients: ClientStatusView[]
  outOfSync: boolean
  desiredState: McpspaceConfig
  lastAppliedState: StateModel
}

export interface WorkspaceService {
  attach(toolName: string, clientName: string): Promise<import('@mcpspace/reconciler').SyncPlan>
  detach(toolName: string, clientName: string): Promise<import('@mcpspace/reconciler').SyncPlan>
  plan(clientName: string): Promise<import('@mcpspace/reconciler').SyncPlan>
  sync(clientName: string, options?: { backup?: boolean }): Promise<import('@mcpspace/reconciler').SyncPlan>
  status(): Promise<WorkspaceStatus>
}

export type DesiredStateRepository = {
  save(config: McpspaceConfig): Promise<void>
}

export type AdapterActualState = {
  detected: boolean
  actual: ActualState
}

