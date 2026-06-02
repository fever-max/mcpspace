export const IPC_CHANNELS = {
  workspace: {
    open: 'workspace:open',
    current: 'workspace:current',
    status: 'workspace:status',
    plan: 'workspace:plan',
    attach: 'workspace:attach',
    detach: 'workspace:detach',
    sync: 'workspace:sync',
  },
  mcp: {
    list: 'mcp:list',
    add: 'mcp:add',
    remove: 'mcp:remove',
  },
} as const
