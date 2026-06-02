import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

export type CodexPaths = {
  configPath: string
  detected: boolean
}

export const resolveCodexPaths = (cwd: string = process.cwd()): CodexPaths => {
  const configPath = resolve(cwd, '.codex', 'config.toml')

  return {
    configPath,
    detected: existsSync(cwd),
  }
}
