import type { ActualState, DesiredState } from '@mcpspace/shared'
import type { SyncPlan } from './types.js'

export interface Planner {
  plan(desired: DesiredState, actual: ActualState): SyncPlan
}

