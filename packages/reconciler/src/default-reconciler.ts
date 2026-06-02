import type { ActualState, DesiredState, McpConfig, McpServerEntry } from '@mcpspace/shared'

import { ReconcileError } from './errors.js'
import type { Planner } from './planner.js'
import type { Reconciler } from './reconciler.js'
import type {
  PlanAction,
  PlanMcpEntry,
  PlanReasonCode,
  SyncPlan,
  SyncPlanSummary,
} from './types.js'

const toPlanEntryFromDesired = (mcp: McpConfig): PlanMcpEntry => ({
  command: mcp.command,
  args: mcp.args ?? [],
  env: mcp.env,
})

const toPlanEntryFromActual = (entry: McpServerEntry): PlanMcpEntry => ({
  command: entry.command,
  args: entry.args,
  env: entry.env,
})

const diffReasonCode = (
  desired: PlanMcpEntry,
  actual: PlanMcpEntry,
): PlanReasonCode | null => {
  if (desired.command !== actual.command) {
    return 'DIFF_COMMAND'
  }

  if (desired.args.length !== actual.args.length) {
    return 'DIFF_ARGS'
  }

  for (let i = 0; i < desired.args.length; i += 1) {
    if (desired.args[i] !== actual.args[i]) {
      return 'DIFF_ARGS'
    }
  }

  const desiredEnv = desired.env ?? {}
  const actualEnv = actual.env ?? {}
  const desiredEnvKeys = Object.keys(desiredEnv).sort()
  const actualEnvKeys = Object.keys(actualEnv).sort()

  if (desiredEnvKeys.length !== actualEnvKeys.length) {
    return 'DIFF_ENV'
  }

  for (let i = 0; i < desiredEnvKeys.length; i += 1) {
    const key = desiredEnvKeys[i]
    if (actualEnvKeys[i] !== key || actualEnv[key] !== desiredEnv[key]) {
      return 'DIFF_ENV'
    }
  }

  return null
}

const buildSummary = (actions: PlanAction[]): SyncPlanSummary => {
  const summary: SyncPlanSummary = {
    create: 0,
    update: 0,
    delete: 0,
    noop: 0,
  }

  for (const action of actions) {
    summary[action.type] += 1
  }

  return summary
}

export class DefaultReconciler implements Reconciler, Planner {
  plan(desired: DesiredState, actual: ActualState): SyncPlan {
    const clientName = actual.clientName
    const desiredClient = desired.clients[clientName]

    if (!desiredClient) {
      throw new ReconcileError(
        'CLIENT_NOT_FOUND',
        `Desired state does not contain client '${clientName}'.`,
      )
    }

    const desiredAssigned = new Set(desiredClient.mcps)

    for (const toolName of desiredAssigned) {
      if (!desired.mcps[toolName]) {
        throw new ReconcileError(
          'INVALID_MCP_REFERENCE',
          `Client '${clientName}' references undefined MCP '${toolName}'.`,
        )
      }
    }

    const actions: PlanAction[] = []

    for (const toolName of desiredAssigned) {
      const desiredMcp = desired.mcps[toolName]
      const desiredEntry = toPlanEntryFromDesired(desiredMcp)
      const actualRawEntry = actual.mcpServers[toolName]

      if (!actualRawEntry) {
        actions.push({
          type: 'create',
          toolName,
          reasonCode: 'MISSING_IN_ACTUAL',
          reason: `ADD ${toolName}`,
          desiredEntry,
        })
        continue
      }

      const actualEntry = toPlanEntryFromActual(actualRawEntry)
      const reasonCode = diffReasonCode(desiredEntry, actualEntry)

      if (reasonCode) {
        actions.push({
          type: 'update',
          toolName,
          reasonCode,
          reason: `UPDATE ${toolName}`,
          desiredEntry,
          actualEntry,
        })
      } else {
        actions.push({
          type: 'noop',
          toolName,
          reasonCode: 'NO_CHANGE',
          reason: `KEEP ${toolName}`,
          desiredEntry,
          actualEntry,
        })
      }
    }

    for (const [toolName, actualRawEntry] of Object.entries(actual.mcpServers)) {
      if (!desiredAssigned.has(toolName)) {
        actions.push({
          type: 'delete',
          toolName,
          reasonCode: 'NOT_ASSIGNED',
          reason: `REMOVE ${toolName}`,
          actualEntry: toPlanEntryFromActual(actualRawEntry),
        })
      }
    }

    actions.sort((a, b) => a.toolName.localeCompare(b.toolName))

    return {
      clientName,
      actions,
      summary: buildSummary(actions),
    }
  }
}

