export type AppConfig = {
  configPath: string
  debug: boolean
}

export type ConfigSources = {
  projectConfigPath: string
  globalConfigPath: string
  statePath: string
}

export type ConfigLoaderOptions = {
  cwd?: string
  configPath?: string
}
