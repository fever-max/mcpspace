import type { SyncPlan } from '@mcpspace/shared'

export interface MergeStrategy {
  merge(currentConfig: string, plan: SyncPlan): string
}

