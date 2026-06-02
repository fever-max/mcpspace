export interface PathResolver {
  getProjectConfigPath(options?: {
    cwd?: string
    explicitConfigPath?: string
    envConfigPath?: string
  }): string
  getGlobalConfigPath(): string
  getGlobalStatePath(): string
  getInstallDir(): string
  getBackupDir(): string
}
