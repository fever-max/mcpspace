import type { ClientAdapter } from './client-adapter.js'

export interface AdapterFactory {
  get(client: string): ClientAdapter
}
