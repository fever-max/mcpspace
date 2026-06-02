import { z } from 'zod'
import { McpSchema } from './mcp.schema.js'

export const DesiredStateSchema = z.object({
  version: z.string(),
  mcps: z.record(McpSchema),
  clients: z.record(z.object({ mcps: z.array(z.string()) })),
})
