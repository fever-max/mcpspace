import type { SyncPlan } from './sync-plan.js'

export type SyncResult = {
  clientName: string
  applied: SyncPlan
  backupPath: string
  success: boolean
  error?: string
}

export type ValidationResult = {
  valid: boolean
  errors: string[]
}
