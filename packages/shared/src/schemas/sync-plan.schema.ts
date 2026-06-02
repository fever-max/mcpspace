import { z } from 'zod'

export const McpServerEntrySchema = z.object({
  name: z.string(),
  command: z.string(),
  args: z.array(z.string()),
  env: z.record(z.string()).optional(),
})

export const SyncPlanSchema = z.object({
  clientName: z.string(),
  add: z.array(McpServerEntrySchema),
  remove: z.array(z.string()),
  update: z.array(McpServerEntrySchema),
  noChange: z.array(z.string()),
})
