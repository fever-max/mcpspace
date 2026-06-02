import type { ActualState, ValidationResult } from '@mcpspace/shared'
import type { AdapterCapabilities } from './adapter-types.js'

export type AdapterPlanEntry = {
  command: string
  args: string[]
  env?: Record<string, string>
}

export type AdapterPlanAction = {
  type: 'create' | 'update' | 'delete' | 'noop'
  toolName: string
  desiredEntry?: AdapterPlanEntry
  actualEntry?: AdapterPlanEntry
}

export type AdapterSyncPlan = {
  clientName: string
  actions: AdapterPlanAction[]
}

export interface ClientAdapter {
  detect(): Promise<boolean>
  readCurrentState(): Promise<ActualState>
  applyPlan(plan: AdapterSyncPlan): Promise<void>
  backup(): Promise<string>
  restore(backupPath: string): Promise<void>
  validate(): Promise<ValidationResult>
  capabilities(): AdapterCapabilities
}

