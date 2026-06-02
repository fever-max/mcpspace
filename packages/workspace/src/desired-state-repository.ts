import { mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { stringify } from 'yaml'

import type { AtomicWriter, ConfigLoader, McpspaceConfig } from '@mcpspace/core'
import type { DesiredStateRepository } from './types.js'

export class FileDesiredStateRepository implements DesiredStateRepository {
  constructor(
    private readonly configLoader: ConfigLoader,
    private readonly atomicWriter: AtomicWriter,
  ) {}

  async save(config: McpspaceConfig): Promise<void> {
    const sources = this.configLoader.resolveSources()
    const content = stringify(config)
    await mkdir(dirname(sources.projectConfigPath), { recursive: true })
    await this.atomicWriter.write(sources.projectConfigPath, content)
  }
}

