export type PlanActionType = 'create' | 'update' | 'delete' | 'noop'

export type PlanReasonCode =
  | 'MISSING_IN_ACTUAL'
  | 'DIFF_COMMAND'
  | 'DIFF_ARGS'
  | 'DIFF_ENV'
  | 'NOT_ASSIGNED'
  | 'NO_CHANGE'

export type PlanMcpEntry = {
  command: string
  args: string[]
  env?: Record<string, string>
}

export type PlanAction = {
  type: PlanActionType
  toolName: string
  reasonCode: PlanReasonCode
  reason: string
  desiredEntry?: PlanMcpEntry
  actualEntry?: PlanMcpEntry
}

export type SyncPlanSummary = {
  create: number
  update: number
  delete: number
  noop: number
}

export type SyncPlan = {
  clientName: string
  actions: PlanAction[]
  summary: SyncPlanSummary
}
