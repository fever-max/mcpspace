import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname } from 'node:path'

import * as TOML from '@iarna/toml'

import type { PathResolver } from '@mcpspace/core'
import type { ActualState, McpServerEntry, ValidationResult } from '@mcpspace/shared'

import type { AdapterCapabilities } from '../adapter-types.js'
import type { AdapterSyncPlan, ClientAdapter } from '../client-adapter.js'
import { resolveCodexPaths } from './codex-paths.js'

type TomlObject = TOML.JsonMap

type TomlMcpServerEntry = {
  command?: unknown
  args?: unknown
  env?: unknown
}

const toTimestamp = (date: Date): string => date.toISOString().replace(/[-:.]/g, '')

const isEnoent = (error: unknown): boolean =>
  typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT'

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []

const toEnvRecord = (value: unknown): Record<string, string> | undefined => {
  if (!value || typeof value !== 'object') {
    return undefined
  }

  const env = Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (acc, [key, val]) => {
      if (typeof val === 'string') {
        acc[key] = val
      }
      return acc
    },
    {},
  )

  return Object.keys(env).length > 0 ? env : undefined
}

const toActualState = (clientName: string, tomlConfig: TomlObject): ActualState => {
  const root = tomlConfig.mcp_servers
  const mcpServersNode = root && typeof root === 'object' ? (root as Record<string, unknown>) : {}
  const mcpServers: Record<string, McpServerEntry> = {}

  for (const [name, raw] of Object.entries(mcpServersNode)) {
    if (!raw || typeof raw !== 'object') {
      continue
    }

    const entry = raw as TomlMcpServerEntry
    if (typeof entry.command !== 'string') {
      continue
    }

    mcpServers[name] = {
      name,
      command: entry.command,
      args: toStringArray(entry.args),
      env: toEnvRecord(entry.env),
    }
  }

  return {
    clientName,
    mcpServers,
  }
}

export class CodexAdapter implements ClientAdapter {
  private readonly configPath: string
  private readonly detected: boolean

  constructor(
    private readonly pathResolver: PathResolver,
    cwd: string = process.cwd(),
  ) {
    const resolved = resolveCodexPaths(cwd)
    this.configPath = resolved.configPath
    this.detected = resolved.detected
  }

  async detect(): Promise<boolean> {
    return this.detected
  }

  async readCurrentState(): Promise<ActualState> {
    if (!this.detected) {
      return { clientName: 'codex', mcpServers: {} }
    }

    try {
      const raw = await readFile(this.configPath, 'utf-8')
      const parsed = TOML.parse(raw) as TomlObject
      return toActualState('codex', parsed)
    } catch (error) {
      if (isEnoent(error)) {
        return { clientName: 'codex', mcpServers: {} }
      }
      throw error
    }
  }

  async applyPlan(plan: AdapterSyncPlan): Promise<void> {
    if (!this.detected) {
      throw new Error('Codex config not detected')
    }

    let parsed = {} as TomlObject
    try {
      const raw = await readFile(this.configPath, 'utf-8')
      parsed = TOML.parse(raw) as TomlObject
    } catch (error) {
      if (!isEnoent(error)) {
        throw error
      }
    }

    const mcpServersRaw = parsed.mcp_servers
    const mcpServers: TOML.JsonMap =
      mcpServersRaw && typeof mcpServersRaw === 'object'
        ? { ...(mcpServersRaw as TOML.JsonMap) }
        : {}

    for (const action of plan.actions) {
      if (action.type === 'create' || action.type === 'update') {
        if (!action.desiredEntry) {
          throw new Error(`Missing desired entry for ${action.type}: ${action.toolName}`)
        }

        mcpServers[action.toolName] = {
          command: action.desiredEntry.command,
          args: action.desiredEntry.args,
          env: action.desiredEntry.env ?? {},
        }
        continue
      }

      if (action.type === 'delete') {
        delete mcpServers[action.toolName]
      }
    }

    parsed.mcp_servers = mcpServers

    await mkdir(dirname(this.configPath), { recursive: true })
    await writeFile(this.configPath, TOML.stringify(parsed), 'utf-8')
  }

  async backup(): Promise<string> {
    if (!this.detected) {
      throw new Error('Codex config not detected')
    }

    const backupDir = this.pathResolver.getBackupDir()
    await mkdir(backupDir, { recursive: true })

    const filename = `${basename(this.configPath)}.mcpspace-backup-${toTimestamp(new Date())}`
    const backupPath = `${backupDir}/${filename}`

    try {
      await copyFile(this.configPath, backupPath)
    } catch (error) {
      if (isEnoent(error)) {
        await writeFile(backupPath, '', 'utf-8')
      } else {
        throw error
      }
    }

    return backupPath
  }

  async restore(backupPath: string): Promise<void> {
    if (!this.configPath) {
      throw new Error('Codex config path is not resolved')
    }

    await mkdir(dirname(this.configPath), { recursive: true })
    await copyFile(backupPath, this.configPath)
  }

  async validate(): Promise<ValidationResult> {
    if (!this.detected) {
      return { valid: false, errors: ['Codex config not detected'] }
    }

    try {
      const raw = await readFile(this.configPath, 'utf-8')
      TOML.parse(raw)
      return { valid: true, errors: [] }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid Codex config'
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

