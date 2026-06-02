import type { ActualState, DesiredState } from '@mcpspace/shared'
import type { SyncPlan } from '../types.js'

export interface SyncPlanDiff {
  diff(desired: DesiredState, actual: ActualState): SyncPlan
}

