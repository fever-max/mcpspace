import type { McpServerEntry } from './actual-state.js'

export type SyncPlan = {
  clientName: string
  add: McpServerEntry[]
  remove: string[]
  update: McpServerEntry[]
  noChange: string[]
}
