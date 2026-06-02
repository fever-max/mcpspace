import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { type AtomicWriter } from '../fs/atomic-writer.js'
import type { PathResolver } from '../paths/path-resolver.js'
import { StateSchema, type StateModel } from '../config/state-schema.js'

export interface StateRepository {
  load(): Promise<StateModel>
  save(state: StateModel): Promise<void>
}

export class FileStateRepository implements StateRepository {
  constructor(
    private readonly pathResolver: PathResolver,
    private readonly atomicWriter: AtomicWriter,
  ) {}

  async load(): Promise<StateModel> {
    const statePath = this.pathResolver.getGlobalStatePath()

    if (!existsSync(statePath)) {
      return StateSchema.parse({ version: '1' })
    }

    const raw = await readFile(statePath, 'utf-8')
    const parsed = JSON.parse(raw) as unknown
    return StateSchema.parse(parsed)
  }

  async save(state: StateModel): Promise<void> {
    const statePath = this.pathResolver.getGlobalStatePath()
    await mkdir(dirname(statePath), { recursive: true })

    const normalized = StateSchema.parse(state)
    const content = JSON.stringify(normalized, null, 2)
    await this.atomicWriter.write(statePath, content)
  }
}
