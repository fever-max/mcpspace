import type { AdapterFactory } from '@mcpspace/adapters'
import type { ConfigLoader, McpspaceConfig, StateRepository } from '@mcpspace/core'
import type { ActualState } from '@mcpspace/shared'
import type { Reconciler, SyncPlan } from '@mcpspace/reconciler'

import type {
  AdapterActualState,
  ClientStatusView,
  DesiredStateRepository,
  WorkspaceService,
  WorkspaceStatus,
} from './types.js'

const toSorted = (values: Iterable<string>): string[] => Array.from(values).sort()

const createActualFallback = (clientName: string): ActualState => ({
  clientName,
  mcpServers: {},
})

const isOutOfSyncByPlan = (plan: SyncPlan): boolean =>
  plan.actions.some((action) => action.type !== 'noop')

export class DefaultWorkspaceService implements WorkspaceService {
  constructor(
    private readonly configLoader: ConfigLoader,
    private readonly stateRepository: StateRepository,
    private readonly adapterFactory: AdapterFactory,
    private readonly reconciler: Reconciler,
    private readonly desiredStateRepository: DesiredStateRepository,
  ) {}

  async attach(toolName: string, clientName: string): Promise<SyncPlan> {
    const desired = await this.configLoader.loadProjectConfig()
    this.ensureToolExists(desired, toolName)

    const current = new Set(desired.clients[clientName]?.mcps ?? [])
    current.add(toolName)
    desired.clients[clientName] = { mcps: toSorted(current) }

    await this.desiredStateRepository.save(desired)

    // TODO(phase2): consider rollback/transaction boundary when post-save steps fail.
    const actual = await this.readActualState(clientName)
    return this.reconciler.plan(desired, actual.actual)
  }

  async detach(toolName: string, clientName: string): Promise<SyncPlan> {
    const desired = await this.configLoader.loadProjectConfig()
    this.ensureToolExists(desired, toolName)

    const current = new Set(desired.clients[clientName]?.mcps ?? [])
    current.delete(toolName)
    desired.clients[clientName] = { mcps: toSorted(current) }

    await this.desiredStateRepository.save(desired)

    // TODO(phase2): consider rollback/transaction boundary when post-save steps fail.
    const actual = await this.readActualState(clientName)
    return this.reconciler.plan(desired, actual.actual)
  }

  async plan(clientName: string): Promise<SyncPlan> {
    const desired = await this.configLoader.loadProjectConfig()
    const actual = await this.readActualState(clientName)
    return this.reconciler.plan(desired, actual.actual)
  }

  async sync(clientName: string, options: { backup?: boolean } = {}): Promise<SyncPlan> {
    const desired = await this.configLoader.loadProjectConfig()
    const adapter = this.adapterFactory.get(clientName)
    const detected = await adapter.detect()
    if (!detected) {
      throw new Error(`Client '${clientName}' is not detected.`)
    }

    const actual = await adapter.readCurrentState()
    const plan = this.reconciler.plan(desired, actual)

    let backupPath: string | undefined

    try {
      if (options.backup !== false) {
        backupPath = await adapter.backup()
      }
      await adapter.applyPlan(plan)

      const validation = await adapter.validate()
      if (!validation.valid) {
        throw new Error(
          `Validation failed for '${clientName}': ${validation.errors.join(', ')}`,
        )
      }

      const state = await this.stateRepository.load()
      state.assignments[clientName] = [...(desired.clients[clientName]?.mcps ?? [])].sort()
      state.lastSync[clientName] = new Date().toISOString()
      await this.stateRepository.save(state)

      return plan
    } catch (error) {
      if (backupPath) {
        await adapter.restore(backupPath)
      }
      throw error
    }
  }

  async status(): Promise<WorkspaceStatus> {
    const desired = await this.configLoader.loadProjectConfig()
    const state = await this.stateRepository.load()

    const clientNames = new Set<string>(Object.keys(desired.clients))

    const clients: ClientStatusView[] = []

    for (const clientName of clientNames) {
      const desiredTools = new Set(desired.clients[clientName]?.mcps ?? [])
      const lastAppliedTools = new Set(state.assignments[clientName] ?? [])

      try {
        const actualInfo = await this.readActualState(clientName)
        const actualTools = new Set(Object.keys(actualInfo.actual.mcpServers))
        const plan = this.reconciler.plan(desired, actualInfo.actual)

        clients.push({
          clientName,
          detected: actualInfo.detected,
          desiredTools: toSorted(desiredTools),
          actualTools: toSorted(actualTools),
          lastAppliedTools: toSorted(lastAppliedTools),
          outOfSync: isOutOfSyncByPlan(plan),
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown status error'
        clients.push({
          clientName,
          detected: false,
          desiredTools: toSorted(desiredTools),
          actualTools: [],
          lastAppliedTools: toSorted(lastAppliedTools),
          outOfSync: true,
          error: message,
        })
      }
    }

    const outOfSync = clients.some((client) => client.outOfSync)
    return {
      clients,
      outOfSync,
      desiredState: desired,
      lastAppliedState: state,
    }
  }

  private ensureToolExists(desired: McpspaceConfig, toolName: string): void {
    if (!desired.mcps[toolName]) {
      throw new Error(`MCP '${toolName}' is not registered.`)
    }
  }

  private async readActualState(clientName: string): Promise<AdapterActualState> {
    const adapter = this.adapterFactory.get(clientName)
    const detected = await adapter.detect()

    if (!detected) {
      return {
        detected: false,
        actual: createActualFallback(clientName),
      }
    }

    const actual = await adapter.readCurrentState()
    return { detected: true, actual }
  }
}

