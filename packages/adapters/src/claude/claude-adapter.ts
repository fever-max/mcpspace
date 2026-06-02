import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'

import type { PathResolver } from '@mcpspace/core'
import type { ActualState, McpServerEntry, ValidationResult } from '@mcpspace/shared'

import type { AdapterCapabilities } from '../adapter-types.js'
import type { AdapterSyncPlan, ClientAdapter } from '../client-adapter.js'
import { ClientConfigSchema } from '../shared/client-config-schema.js'
import { resolveClaudePaths } from './claude-paths.js'

const toTimestamp = (date: Date): string => date.toISOString().replace(/[-:.]/g, '')

const toActualState = (clientName: string, config: unknown): ActualState => {
  const parsed = ClientConfigSchema.parse(config)
  const mcpServers: Record<string, McpServerEntry> = {}

  for (const [name, value] of Object.entries(parsed.mcpServers)) {
    mcpServers[name] = {
      name,
      command: value.command,
      args: value.args,
      env: value.env,
    }
  }

  return {
    clientName,
    mcpServers,
  }
}

const isEnoent = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'

export class ClaudeDesktopAdapter implements ClientAdapter {
  private readonly configPath: string
  private readonly detected: boolean

  constructor(
    private readonly pathResolver: PathResolver,
    env: NodeJS.ProcessEnv = process.env,
  ) {
    const resolved = resolveClaudePaths(env)
    this.configPath = resolved.configPath
    this.detected = resolved.detected
  }

  async detect(): Promise<boolean> {
    return this.detected
  }

  async readCurrentState(): Promise<ActualState> {
    if (!this.detected) {
      return { clientName: 'claude-desktop', mcpServers: {} }
    }

    try {
      const raw = await readFile(this.configPath, 'utf-8')
      const parsed = JSON.parse(raw) as unknown
      return toActualState('claude-desktop', parsed)
    } catch (error) {
      if (isEnoent(error)) {
        return { clientName: 'claude-desktop', mcpServers: {} }
      }
      throw error
    }
  }

  async applyPlan(plan: AdapterSyncPlan): Promise<void> {
    if (!this.detected) {
      throw new Error('Claude Desktop config not detected')
    }

    let parsed: unknown = {}
    try {
      const raw = await readFile(this.configPath, 'utf-8')
      parsed = JSON.parse(raw) as unknown
    } catch (error) {
      if (!isEnoent(error)) {
        throw error
      }
    }

    const config = ClientConfigSchema.parse(parsed)

    for (const action of plan.actions) {
      if (action.type === 'create' || action.type === 'update') {
        if (!action.desiredEntry) {
          throw new Error(`Missing desired entry for ${action.type}: ${action.toolName}`)
        }

        config.mcpServers[action.toolName] = {
          command: action.desiredEntry.command,
          args: action.desiredEntry.args,
          env: action.desiredEntry.env,
        }
        continue
      }

      if (action.type === 'delete') {
        delete config.mcpServers[action.toolName]
      }
    }

    await mkdir(dirname(this.configPath), { recursive: true })
    await writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf-8')
  }

  async backup(): Promise<string> {
    if (!this.detected) {
      throw new Error('Claude Desktop config not detected')
    }

    const backupDir = this.pathResolver.getBackupDir()
    await mkdir(backupDir, { recursive: true })

    const filename = `${basename(this.configPath)}.mcpspace-backup-${toTimestamp(new Date())}`
    const backupPath = `${backupDir}/${filename}`

    try {
      await copyFile(this.configPath, backupPath)
    } catch (error) {
      if (isEnoent(error)) {
        await writeFile(backupPath, JSON.stringify({ mcpServers: {} }, null, 2), 'utf-8')
      } else {
        throw error
      }
    }

    return backupPath
  }

  async restore(backupPath: string): Promise<void> {
    if (!this.configPath) {
      throw new Error('Claude Desktop config path is not resolved')
    }

    await mkdir(dirname(this.configPath), { recursive: true })
    await copyFile(backupPath, this.configPath)
  }

  async validate(): Promise<ValidationResult> {
    if (!this.detected) {
      return { valid: false, errors: ['Claude Desktop config not detected'] }
    }

    try {
      const raw = await readFile(this.configPath, 'utf-8')
      const parsed = JSON.parse(raw) as unknown
      ClientConfigSchema.parse(parsed)
      return { valid: true, errors: [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid Claude Desktop config'
      return { valid: false, errors: [message] }
    }
  }

  capabilities(): AdapterCapabilities {
    return {
      detect: true,
      readCurrentState: true,
      backup: true,
      restore: true,
      validate: true,
      apply: true,
    }
  }
}




