import { z } from 'zod'

export const LastSyncSchema = z.record(z.string().datetime({ offset: true }))

export const StateSchema = z.object({
  version: z.literal('1'),
  assignments: z.record(z.array(z.string())).default({}),
  lastSync: LastSyncSchema.default({}),
})

export type StateModel = z.infer<typeof StateSchema>
