export const IPC_CHANNELS = {
  workspace: {
    open: 'workspace:open',
    openPath: 'workspace:open-path',
    init: 'workspace:init',
    current: 'workspace:current',
    status: 'workspace:status',
    attach: 'workspace:attach',
    detach: 'workspace:detach',
    plan: 'workspace:plan',
    sync: 'workspace:sync',
    mcpAdd: 'workspace:mcp-add',
    mcpUpdate: 'workspace:mcp-update',
    mcpRemove: 'workspace:mcp-remove',
    copyPath: 'workspace:copy-path',
    openInExplorer: 'workspace:open-in-explorer',
  },
} as const
