import { z } from 'zod'

export const McpConfigSchema = z.object({
  package: z.string().default(''),
  command: z.string().min(1),
  args: z.array(z.string()).default([]),
  env: z.record(z.string()).default({}),
})

export const ClientConfigSchema = z.object({
  mcps: z.array(z.string()).default([]),
})

export const McpspaceConfigSchema = z.object({
  version: z.literal('1'),
  mcps: z.record(McpConfigSchema).default({}),
  clients: z.record(ClientConfigSchema).default({}),
})

export const GlobalConfigSchema = z.object({
  version: z.literal('1').default('1'),
  defaults: z
    .object({
      installDir: z.string().optional(),
      backupDir: z.string().optional(),
    })
    .default({}),
  log: z
    .object({
      level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    })
    .default({ level: 'info' }),
})

export type McpspaceConfig = z.infer<typeof McpspaceConfigSchema>
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>

