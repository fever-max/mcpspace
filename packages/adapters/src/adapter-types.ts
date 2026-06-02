export enum AdapterKind {
  ClaudeDesktop = 'claude-desktop',
  ClaudeCode = 'claude-code',
  Codex = 'codex',
  Cursor = 'cursor',
}

export type AdapterName = `${AdapterKind}`

export type AdapterCapabilities = {
  detect: true
  readCurrentState: true
  backup: true
  restore: true
  validate: true
  apply: boolean
}


