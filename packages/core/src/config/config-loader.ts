import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { parse as parseYaml } from 'yaml'

import type { PathResolver } from '../paths/path-resolver.js'
import type { ConfigLoaderOptions, ConfigSources } from '../types/app-config.js'
import {
  GlobalConfigSchema,
  McpspaceConfigSchema,
  type GlobalConfig,
  type McpspaceConfig,
} from './config-schema.js'

export interface ConfigLoader {
  loadProjectConfig(options?: ConfigLoaderOptions): Promise<McpspaceConfig>
  loadGlobalConfig(): Promise<GlobalConfig>
  resolveSources(options?: ConfigLoaderOptions): ConfigSources
}

export class FileConfigLoader implements ConfigLoader {
  constructor(
    private readonly pathResolver: PathResolver,
    private readonly env: NodeJS.ProcessEnv = process.env,
  ) {}

  async loadProjectConfig(options?: ConfigLoaderOptions): Promise<McpspaceConfig> {
    const sources = this.resolveSources(options)
    const raw = await this.readYamlFile(sources.projectConfigPath)
    return McpspaceConfigSchema.parse(raw)
  }

  async loadGlobalConfig(): Promise<GlobalConfig> {
    const path = this.pathResolver.getGlobalConfigPath()
    if (!existsSync(path)) {
      return GlobalConfigSchema.parse({ version: '1' })
    }

    const raw = await this.readYamlFile(path)
    return GlobalConfigSchema.parse(raw)
  }

  resolveSources(options?: ConfigLoaderOptions): ConfigSources {
    const projectConfigPath = this.pathResolver.getProjectConfigPath({
      cwd: options?.cwd,
      explicitConfigPath: options?.configPath,
      envConfigPath: this.env.MCPSPACE_CONFIG_PATH,
    })

    return {
      projectConfigPath,
      globalConfigPath: this.pathResolver.getGlobalConfigPath(),
      statePath: this.pathResolver.getGlobalStatePath(),
    }
  }

  private async readYamlFile(path: string): Promise<unknown> {
    const raw = await readFile(path, 'utf-8')
    return parseYaml(raw)
  }
}

