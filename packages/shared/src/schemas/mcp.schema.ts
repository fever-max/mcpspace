import { z } from 'zod'

export const McpSchema = z.object({
  package: z.string().min(1),
  command: z.string().min(1),
  args: z.array(z.string()).optional(),
  env: z.record(z.string()).optional(),
})
