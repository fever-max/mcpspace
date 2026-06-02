#!/usr/bin/env node
import { Command } from 'commander'

import { createServices } from './bootstrap/create-services.js'
import { registerCommands } from './bootstrap/register-commands.js'

export const run = async (argv: string[]): Promise<void> => {
  const services = createServices()

  const program = new Command()
  program.name('mcpspace')
  program.description('MCP Workspace Manager CLI')
  program.version(services.version)

  registerCommands(program, services)

  await program.parseAsync(argv)
}

if (process.argv[1]) {
  run(process.argv).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown fatal error'
    console.error(message)
    process.exitCode = 1
  })
}
