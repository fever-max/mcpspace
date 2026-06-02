import { z } from 'zod'

const McpServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).optional(),
})

export const ClientConfigSchema = z.object({
  mcpServers: z.record(McpServerConfigSchema).default({}),
})

export type ClientConfig = z.infer<typeof ClientConfigSchema>
