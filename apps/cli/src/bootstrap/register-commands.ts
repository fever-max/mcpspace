import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { Command } from 'commander'

import type { PlanAction, SyncPlan } from '@mcpspace/reconciler'

import type { CliServices } from './create-services.js'

const formatPlan = (plan: SyncPlan): string[] => {
  const lines: string[] = []
  lines.push(`Client: ${plan.clientName}`)
  lines.push('')

  for (const action of plan.actions) {
    lines.push(`${action.type.toUpperCase()} ${action.toolName}`)
  }

  if (plan.actions.length === 0) {
    lines.push('NOOP')
  }

  lines.push('')
  lines.push('Summary')
  lines.push(`Create: ${plan.summary.create}`)
  lines.push(`Update: ${plan.summary.update}`)
  lines.push(`Delete: ${plan.summary.delete}`)
  lines.push(`Noop: ${plan.summary.noop}`)

  return lines
}

const printLines = (lines: string[]): void => {
  for (const line of lines) {
    console.log(line)
  }
}

const printError = (error: unknown): void => {
  const message = error instanceof Error ? error.message : 'Unknown error'
  console.error(message)
}

export const registerCommands = (
  program: Command,
  services: CliServices,
): void => {
  program
    .command('init')
    .description('create .mcpspace/config.yaml in current directory')
    .action(async () => {
      try {
        const targetPath = resolve(process.cwd(), '.mcpspace', 'config.yaml')
        if (existsSync(targetPath)) {
          throw new Error(`.mcpspace/config.yaml already exists: ${targetPath}`)
        }

        const content = ['version: "1"', '', 'mcps: {}', '', 'clients: {}', ''].join('\n')
        await mkdir(dirname(targetPath), { recursive: true })
        await writeFile(targetPath, content, 'utf-8')
        console.log(`Created: ${targetPath}`)
      } catch (error) {
        printError(error)
        process.exitCode = 1
      }
    })

  program
    .command('version')
    .description('show mcpspace version')
    .action(() => {
      console.log(`mcpspace ${services.version}`)
    })

  const collectArg = (val: string, prev: string[]) => [...prev, val]
  const collectEnv = (val: string, prev: Record<string, string>) => {
    const eqIdx = val.indexOf('=')
    if (eqIdx === -1) return prev
    return { ...prev, [val.slice(0, eqIdx)]: val.slice(eqIdx + 1) }
  }

  const mcp = program.command('mcp').description('manage MCP registry')

  mcp
    .command('add <tool>')
    .description('register MCP tool (catalog name or custom with --command)')
    .option('--command <cmd>', 'command to run the MCP server (required for custom MCPs)')
    .option('--arg <value>', 'argument passed to the command (repeatable)', collectArg, [] as string[])
    .option('--env <KEY=VALUE>', 'environment variable (repeatable)', collectEnv, {} as Record<string, string>)
    .option('--package <pkg>', 'npm package name (informational, optional)')
    .action(async (tool: string, opts: { command?: string; arg: string[]; env: Record<string, string>; package?: string }) => {
      try {
        const config = await services.mcp.add(tool, {
          command: opts.command,
          args: opts.arg.length > 0 ? opts.arg : undefined,
          env: Object.keys(opts.env).length > 0 ? opts.env : undefined,
          package: opts.package,
        })
        const entry = config.mcps[tool]
        console.log(`Added MCP: ${tool}`)
        if (entry.package) console.log(`Package: ${entry.package}`)
        console.log(`Command: ${entry.command}`)
        if (entry.args && entry.args.length > 0) console.log(`Args: ${entry.args.join(' ')}`)
      } catch (error) {
        printError(error)
        process.exitCode = 1
      }
    })

  mcp
    .command('remove <tool>')
    .description('remove MCP tool from desired state')
    .action(async (tool: string) => {
      try {
        await services.mcp.remove(tool)
        console.log(`Removed MCP: ${tool}`)
      } catch (error) {
        printError(error)
        process.exitCode = 1
      }
    })

  mcp
    .command('list')
    .description('list registered MCP tools')
    .action(async () => {
      try {
        const items = await services.mcp.list()
        console.log(`MCPs (${items.length})`)
        for (const item of items) {
          const clients = item.clients.length > 0 ? item.clients.join(', ') : '(unassigned)'
          console.log(`${item.toolName}  ${item.package}  ${clients}`)
        }
      } catch (error) {
        printError(error)
        process.exitCode = 1
      }
    })

  program
    .command('attach <tool> <client>')
    .description('attach MCP tool to client and create sync plan')
    .action(async (tool: string, client: string) => {
      try {
        const plan = await services.workspace.attach(tool, client)
        printLines(formatPlan(plan))
      } catch (error) {
        printError(error)
        process.exitCode = 1
      }
    })

  program
    .command('detach <tool> <client>')
    .description('detach MCP tool from client and create sync plan')
    .action(async (tool: string, client: string) => {
      try {
        const plan = await services.workspace.detach(tool, client)
        printLines(formatPlan(plan))
      } catch (error) {
        printError(error)
        process.exitCode = 1
      }
    })

  program
    .command('plan <client>')
    .description('show sync plan for client')
    .action(async (client: string) => {
      try {
        const plan = await services.workspace.plan(client)
        printLines(formatPlan(plan))
      } catch (error) {
        printError(error)
        process.exitCode = 1
      }
    })

  program
    .command('sync <client>')
    .description('create sync plan for client (apply not implemented in phase1)')
    .action(async (client: string) => {
      try {
        const plan = await services.workspace.sync(client)
        printLines(formatPlan(plan))
      } catch (error) {
        printError(error)
        process.exitCode = 1
      }
    })

  program
    .command('status')
    .description('show workspace sync status')
    .action(async () => {
      try {
        const status = await services.workspace.status()
        for (const client of status.clients) {
          console.log(`Client: ${client.clientName}`)
          console.log(`Status: ${client.outOfSync ? 'OUT_OF_SYNC' : 'IN_SYNC'}`)
          if (client.error) {
            console.log(`Error: ${client.error}`)
          }

          const plan = await services.workspace.plan(client.clientName)
          const actionable = plan.actions.filter((action) => action.type !== 'noop') as PlanAction[]
          console.log('Actions:')
          if (actionable.length === 0) {
            console.log('* NONE')
          } else {
            for (const action of actionable) {
              console.log(`* ${action.type.toUpperCase()} ${action.toolName}`)
            }
          }
          console.log('')
        }
      } catch (error) {
        printError(error)
        process.exitCode = 1
      }
    })
}
