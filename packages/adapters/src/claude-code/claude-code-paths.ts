import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

export type ClaudeCodePaths = {
  configPath: string
  detected: boolean
}

export const resolveClaudeCodePaths = (
  cwd: string = process.cwd(),
): ClaudeCodePaths => {
  const configPath = resolve(cwd, '.mcp.json')
  const projectDir = dirname(configPath)

  return {
    configPath,
    detected: existsSync(projectDir),
  }
}
