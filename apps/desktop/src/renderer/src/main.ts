import './styles/app.css'

import type { ClientId, ClientStatusDto, WorkspaceContextDto, WorkspaceStatusDto } from '../../shared/dtos.js'

type ViewState = {
  workspace: WorkspaceContextDto | null
  status: WorkspaceStatusDto | null
  loading: boolean
  error: string | null
  initConfirmOpen: boolean
  selectedClient: ClientId | null
  draftAssignments: Record<ClientId, string[]>
  theme: 'light' | 'dark'
}

const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('App root not found')
}

const state: ViewState = {
  workspace: null,
  status: null,
  loading: false,
  error: null,
  initConfirmOpen: false,
  selectedClient: null,
  draftAssignments: {
    'claude-desktop': [],
    'claude-code': [],
    codex: [],
    cursor: [],
  },
  theme: 'light',
}

const disabledAttr = (value: boolean): string => (value ? 'disabled aria-disabled="true"' : '')

const icon = {
  folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h4.39c.6 0 1.17.24 1.59.66l1.15 1.14c.42.42.99.66 1.59.66h5.83A2.25 2.25 0 0 1 22 9.21v7.54A2.25 2.25 0 0 1 19.75 19H5.25A2.25 2.25 0 0 1 3 16.75V6.75Z" fill="currentColor"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8.25A2.25 2.25 0 0 1 10.25 6h7.5A2.25 2.25 0 0 1 20 8.25v7.5A2.25 2.25 0 0 1 17.75 18h-7.5A2.25 2.25 0 0 1 8 15.75v-7.5Zm-3 3A2.25 2.25 0 0 1 7.25 9H8v2h-.75a.25.25 0 0 0-.25.25v7.5c0 .14.11.25.25.25h7.5c.14 0 .25-.11.25-.25V18h2v.75A2.25 2.25 0 0 1 15.75 21h-7.5A2.25 2.25 0 0 1 6 18.75v-7.5Z" fill="currentColor"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 2.5 11 7l4.5 1.5L11 10l-1.5 4.5L8 10 3.5 8.5 8 7l1.5-4.5ZM17.5 12.5 18.5 15l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5ZM16 3.5 16.7 5l1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.5Z" fill="currentColor"/></svg>',
  open: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.41l-8.29 8.3-1.42-1.42 8.3-8.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z" fill="currentColor"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4a6.5 6.5 0 1 0 4.09 11.54l4.94 4.94 1.41-1.41-4.94-4.94A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" fill="currentColor"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.76-4.24L14 10h6V4l-2.35 2.35Z" fill="currentColor"/></svg>',
  dots: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm8-5a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM6 12a1 1 0 0 1-1 1H4a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1Zm10.95-5.95a1 1 0 0 1 1.41 0l.7.7a1 1 0 1 1-1.41 1.41l-.7-.7a1 1 0 0 1 0-1.41ZM6.34 17.66a1 1 0 0 1 1.41 0l.7.7a1 1 0 0 1-1.41 1.41l-.7-.7a1 1 0 0 1 0-1.41Zm11.72 1.41a1 1 0 0 1 0-1.41l.7-.7a1 1 0 1 1 1.41 1.41l-.7.7a1 1 0 0 1-1.41 0ZM6.34 6.34a1 1 0 0 1 0-1.41l.7-.7a1 1 0 0 1 1.41 1.41l-.7.7a1 1 0 0 1-1.41 0Z" fill="currentColor"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.2A8.8 8.8 0 1 1 11.8 3a7 7 0 0 0 9.2 9.2Z" fill="currentColor"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h10A2.5 2.5 0 0 1 20 4.5v15A2.5 2.5 0 0 1 17.5 22H7a3 3 0 0 1-3-3V4.5Zm2.5-.5A.5.5 0 0 0 7 4.5V19a1 1 0 0 0 1 1h9.5a.5.5 0 0 0 .5-.5v-15a.5.5 0 0 0-.5-.5h-10Z" fill="currentColor"/></svg>',
  warning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11.25 4.56a1 1 0 0 1 1.5 0l8.08 11.73A1 1 0 0 1 20.01 18H3.99a1 1 0 0 1-.83-1.71L11.25 4.56ZM12 9a1 1 0 0 0-1 1v3.5a1 1 0 1 0 2 0V10a1 1 0 0 0-1-1Zm0 8.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" fill="currentColor"/></svg>',
}

const getWorkspaceBadgeLabel = (workspace: WorkspaceContextDto | null, status: WorkspaceStatusDto | null): string | null => {
  if (!workspace) {
    return null
  }

  if (workspace.status === 'not_initialized') {
    return 'Not initialized'
  }

  if (!status) {
    return 'Ready'
  }

  return status.outOfSyncCount > 0 ? 'Out of sync' : 'In sync'
}

const getWorkspaceBadgeClass = (workspace: WorkspaceContextDto | null, status: WorkspaceStatusDto | null): string => {
  if (!workspace) {
    return ''
  }

  if (workspace.status === 'not_initialized') {
    return 'badge warning'
  }

  if (!status || status.outOfSyncCount === 0) {
    return 'badge success'
  }

  return 'badge danger'
}


const clientOrder: ClientId[] = ['codex', 'claude-code', 'cursor', 'claude-desktop']

const clientDisplayNames: Record<ClientId, string> = {
  'claude-desktop': 'Claude Desktop',
  'claude-code': 'Claude Code',
  codex: 'Codex',
  cursor: 'Cursor',
}

const clientAvatarLabels: Record<ClientId, string> = {
  'claude-desktop': 'CD',
  'claude-code': 'CC',
  codex: 'CX',
  cursor: 'CU',
}

const toolDisplayNames: Record<string, string> = {
  filesystem: 'File system operations',
  github: 'GitHub API integration',
  playwright: 'Browser automation',
  postgres: 'PostgreSQL database',
  sqlite: 'SQLite database',
}

const toolAvatarLabels: Record<string, string> = {
  filesystem: 'FS',
  github: 'GH',
  playwright: 'PW',
  postgres: 'PG',
  sqlite: 'SQ',
}

const getClientDisplayName = (client: ClientId): string => clientDisplayNames[client] ?? client
const getClientAvatarLabel = (client: ClientId): string => clientAvatarLabels[client] ?? client.slice(0, 2).toUpperCase()
const getToolDisplayName = (toolName: string): string => toolDisplayNames[toolName] ?? toolName
const getToolAvatarLabel = (toolName: string): string => toolAvatarLabels[toolName] ?? toolName.slice(0, 2).toUpperCase()

const getPreferredClientSelection = (clients: ClientStatusDto[]): ClientId | null => {
  for (const clientId of clientOrder) {
    if (clients.some((client) => client.clientName === clientId)) {
      return clientId
    }
  }

  return clients[0]?.clientName ?? null
}

const getActualAssignmentsForClient = (status: WorkspaceStatusDto | null, client: ClientId): string[] => {
  if (!status) {
    return []
  }

  return status.tools.filter((tool) => tool.clients.includes(client)).map((tool) => tool.toolName)
}

const sortToolsByWorkspaceOrder = (status: WorkspaceStatusDto | null, toolNames: string[]): string[] => {
  const uniqueToolNames = [...new Set(toolNames)]

  if (!status) {
    return uniqueToolNames
  }

  const order = new Map(status.tools.map((tool, index) => [tool.toolName, index]))
  return uniqueToolNames.sort((left, right) => (order.get(left) ?? Number.MAX_SAFE_INTEGER) - (order.get(right) ?? Number.MAX_SAFE_INTEGER))
}

const buildDraftAssignmentsFromStatus = (status: WorkspaceStatusDto | null): Record<ClientId, string[]> => ({
  'claude-desktop': sortToolsByWorkspaceOrder(status, getActualAssignmentsForClient(status, 'claude-desktop')),
  'claude-code': sortToolsByWorkspaceOrder(status, getActualAssignmentsForClient(status, 'claude-code')),
  codex: sortToolsByWorkspaceOrder(status, getActualAssignmentsForClient(status, 'codex')),
  cursor: sortToolsByWorkspaceOrder(status, getActualAssignmentsForClient(status, 'cursor')),
})

const clearDraftAssignments = (): Record<ClientId, string[]> => ({
  'claude-desktop': [],
  'claude-code': [],
  codex: [],
  cursor: [],
})

const getDraftToolsForClient = (client: ClientId): string[] => state.draftAssignments[client] ?? []

const getSelectedClient = (): ClientId | null => state.selectedClient ?? getPreferredClientSelection(state.status?.clients ?? [])

const getClientStatusLabel = (client: ClientStatusDto): string => {
  if (client.assignedMcpCount === 0) {
    return 'Not Configured'
  }

  return client.outOfSync ? 'Out of Sync' : 'In Sync'
}

const getClientStatusClass = (client: ClientStatusDto): string => {
  if (client.assignedMcpCount === 0) {
    return 'pill pill-neutral'
  }

  return client.outOfSync ? 'pill pill-warning' : 'pill pill-success'
}

const toggleSelectedClientTool = (toolName: string): void => {
  const selectedClient = getSelectedClient()
  if (!selectedClient) {
    return
  }

  const currentTools = new Set(getDraftToolsForClient(selectedClient))
  if (currentTools.has(toolName)) {
    currentTools.delete(toolName)
  } else {
    currentTools.add(toolName)
  }

  state.draftAssignments = {
    ...state.draftAssignments,
    [selectedClient]: sortToolsByWorkspaceOrder(state.status, [...currentTools]),
  }
}

type ReadyChangeRow = {
  type: 'attach' | 'detach' | 'noop'
  toolName: string
}

const buildChangeRows = (selectedClient: ClientId, tools: WorkspaceStatusDto['tools']): ReadyChangeRow[] => {
  const actualTools = new Set(getActualAssignmentsForClient(state.status, selectedClient))
  const draftTools = new Set(getDraftToolsForClient(selectedClient))

  return tools.map((tool) => {
    const actual = actualTools.has(tool.toolName)
    const draft = draftTools.has(tool.toolName)

    if (draft && actual) {
      return { type: 'noop', toolName: tool.toolName }
    }

    if (draft) {
      return { type: 'attach', toolName: tool.toolName }
    }

    if (actual) {
      return { type: 'detach', toolName: tool.toolName }
    }

    return { type: 'noop', toolName: tool.toolName }
  })
}

const renderProjectStrip = (workspace: WorkspaceContextDto): string => `
  <section class="project-strip card">
    <div class="project-strip-copy">
      <div class="strip-label">Project Path</div>
      <div class="strip-value">${workspace.path}</div>
    </div>
    <div class="project-strip-actions">
      <button class="button secondary icon-button" type="button" aria-label="Copy project path" title="Copy project path"><span class="button-icon">${icon.copy}</span></button>
      <button class="button secondary icon-button" type="button" aria-label="Open in Explorer" title="Open in Explorer"><span class="button-icon">${icon.open}</span></button>
    </div>
  </section>
`
const renderSidebarWorkspace = (): string => {
  if (!state.workspace) {
    return `
      <section class="sidebar-workspaces empty">
        <div class="sidebar-workspaces-heading">Your Workspaces</div>
        <div class="sidebar-empty-title">No workspaces yet</div>
        <div class="sidebar-empty-subtitle">Open a project folder to get started.</div>
      </section>
    `
  }

  return `
    <section class="sidebar-workspaces">
      <div class="sidebar-workspaces-heading">Your Workspaces</div>
      <button class="sidebar-workspace-item active" type="button" data-action="open-workspace">
        <span class="sidebar-workspace-icon">${icon.folder}</span>
        <span class="sidebar-workspace-meta">
          <span class="sidebar-workspace-name">${state.workspace.name}</span>
          <span class="sidebar-workspace-path">${state.workspace.path}</span>
        </span>
      </button>
    </section>
  `
}

const renderEmptyState = (): string => `
  <section class="hero empty">
    <div class="hero-illustration hero-illustration-empty" aria-hidden="true">
      <div class="hero-badge"></div>
      <div class="hero-folder"></div>
    </div>
    <div class="hero-copy">
      <div class="hero-title">No workspace connected</div>
      <p class="hero-description">Open a project folder to connect a workspace and start managing MCP tools for your AI clients.</p>
    </div>
    <div class="hero-actions">
      <button data-action="open-workspace" class="button primary"><span class="button-icon">${icon.folder}</span><span>Open Workspace</span></button>
      <button class="ghost-link" type="button" disabled><span class="button-icon link-icon">${icon.book}</span><span>Learn more about workspaces</span></button>
    </div>
  </section>
`


const renderNotInitializedState = (): string => {
  const workspace = state.workspace

  if (!workspace) {
    return ''
  }

  return `
    <div class="workspace-stack">
      ${renderProjectStrip(workspace)}

      <section class="hero not-initialized">
        <div class="hero-illustration hero-illustration-warning" aria-hidden="true">
          <div class="hero-warning-mark">${icon.warning}</div>
        </div>
        <div class="hero-copy">
          <div class="hero-title">Workspace not initialized</div>
          <p class="hero-description">This workspace has been opened, but it has not been initialized yet.</p>
          <div class="hero-chip">.mcpspace/config.yaml</div>
          <p class="hero-subtext">The configuration file .mcpspace/config.yaml does not exist in this workspace.</p>
          <p class="hero-subtext">Initialize the workspace to set up MCP tools, AI clients, and other project-specific configurations.</p>
        </div>
        <div class="hero-actions">
          <button data-action="show-init-confirm" class="button primary" ${disabledAttr(state.loading)}><span class="button-icon">${icon.sparkles}</span><span>Initialize Workspace</span></button>
          <button data-action="open-workspace" class="button secondary" ${disabledAttr(state.loading)}><span class="button-icon">${icon.folder}</span><span>Open Another Workspace</span></button>
        </div>
      </section>

      <section class="info-card card">
        <div class="info-card-header">What happens when you initialize?</div>
        <div class="info-card-body">
          mcpspace will create a <code>.mcpspace</code> folder in this workspace and generate a <code>config.yaml</code> file with default settings. You can customize the configuration after initialization.
        </div>
      </section>
    </div>
  `
}

const renderReadyState = (): string => {
  const status = state.status
  const workspace = state.workspace

  if (!workspace) {
    return ''
  }

  const clients = [...(status?.clients ?? [])].sort((left, right) => clientOrder.indexOf(left.clientName) - clientOrder.indexOf(right.clientName))
  const tools = status?.tools ?? []
  const selectedClient = getSelectedClient()
  const selectedClientLabel = selectedClient ? getClientDisplayName(selectedClient) : 'Select an AI client'
  const selectedClientDraft = selectedClient ? getDraftToolsForClient(selectedClient) : []
  const changeRows = selectedClient ? buildChangeRows(selectedClient, tools) : []

  return `
    <div class="workspace-stack">
      ${renderProjectStrip(workspace)}

      <section class="ready-grid">
        <section class="card panel">
          <div class="panel-header">
            <h2>AI Clients</h2>
            <p class="muted">Select an AI client to manage its MCP tools.</p>
          </div>
          <div class="client-list">
            ${
              clients.length === 0
                ? '<div class="list-empty">No client status yet.</div>'
                : clients
                    .map(
                      (client) => `
                        <button
                          type="button"
                          class="client-row client-row-button${selectedClient === client.clientName ? ' selected' : ''}"
                          data-action="select-client"
                          data-client="${client.clientName}"
                        >
                          <span class="client-row-main">
                            <span class="client-avatar client-avatar-${client.clientName}">${getClientAvatarLabel(client.clientName)}</span>
                            <span class="client-copy">
                              <span class="client-name">${getClientDisplayName(client.clientName)}</span>
                            </span>
                          </span>
                          <span class="client-row-side">
                            <span class="${getClientStatusClass(client)}">${getClientStatusLabel(client)}</span>
                            <span class="client-chevron" aria-hidden="true">›</span>
                          </span>
                        </button>
                      `,
                    )
                    .join('')
            }
          </div>
          <div class="client-footnote">${selectedClient ? `1 of ${clients.length} selected` : 'Select an AI client to begin.'}</div>
        </section>

        <section class="card panel">
          <div class="panel-header panel-header-split">
            <div>
              <h2>MCP Tools for ${selectedClientLabel}</h2>
              <p class="muted">Choose which MCP tools should be available to ${selectedClientLabel}.</p>
            </div>
            <div class="selected-client-chip">
              <span class="selected-client-label">Selected Client</span>
              <span class="pill pill-neutral">${selectedClientLabel}</span>
            </div>
          </div>

          ${
            selectedClient
              ? `
                <div class="tool-list">
                  ${
                    tools.length === 0
                      ? '<div class="list-empty">No MCP tools registered.</div>'
                      : tools
                          .map(
                            (tool) => {
                              const checked = selectedClientDraft.includes(tool.toolName)
                              return `
                                <label class="tool-row tool-row-selectable${checked ? ' selected' : ''}">
                                  <span class="tool-row-main">
                                    <span class="tool-avatar tool-avatar-${tool.toolName}">${getToolAvatarLabel(tool.toolName)}</span>
                                    <span class="tool-copy">
                                      <span class="tool-name">${tool.toolName}</span>
                                      <span class="tool-meta">${getToolDisplayName(tool.toolName)}</span>
                                    </span>
                                  </span>
                                  <input
                                    class="tool-checkbox"
                                    type="checkbox"
                                    data-action="toggle-tool"
                                    data-tool="${tool.toolName}"
                                    data-client="${selectedClient}"
                                    ${checked ? 'checked' : ''}
                                  />
                                </label>
                              `
                            },
                          )
                          .join('')
                  }
                </div>
                <div class="tool-footnote">${selectedClientDraft.length} of ${tools.length} selected</div>
              `
              : '<div class="selected-client-empty list-empty">Select an AI client to manage its MCP tools.</div>'
          }
        </section>
      </section>

      <section class="card panel changes-panel">
        <div class="panel-header changes-header">
          <div>
            <h2>Changes to Apply</h2>
            <p class="muted">Review the changes that will be applied to ${selectedClientLabel}.</p>
          </div>
          <button class="button secondary" type="button" disabled><span class="button-icon">${icon.search}</span><span>View Plan Details</span></button>
        </div>

        <div class="changes-list">
          ${
            selectedClient
              ? changeRows.length === 0
                ? '<div class="changes-empty">No changes to apply.</div>'
                : changeRows
                    .map(
                      (row) => {
                        if (row.type === 'attach') {
                          return `
                            <div class="change-row change-attach">
                              <span class="change-icon">↑</span>
                              <span>Attach <strong>${row.toolName}</strong> to <strong>${selectedClientLabel}</strong></span>
                              <span class="pill pill-success">Attach</span>
                            </div>
                          `
                        }

                        if (row.type === 'detach') {
                          return `
                            <div class="change-row change-detach">
                              <span class="change-icon">↓</span>
                              <span>Detach <strong>${row.toolName}</strong> from <strong>${selectedClientLabel}</strong></span>
                              <span class="pill pill-warning">Detach</span>
                            </div>
                          `
                        }

                        return `
                          <div class="change-row change-noop">
                            <span class="change-icon">i</span>
                            <span>No change for <strong>${row.toolName}</strong></span>
                            <span class="pill pill-neutral">No Change</span>
                          </div>
                        `
                      },
                    )
                    .join('')
              : '<div class="changes-empty">Select an AI client to review changes.</div>'
          }
        </div>
      </section>

      <section class="action-bar">
        <button class="button secondary" type="button" disabled><span class="button-icon">${icon.search}</span><span>Review Changes</span></button>
        <button class="button primary" type="button" disabled><span class="button-icon">${icon.refresh}</span><span>Apply Changes</span></button>
      </section>

      <section class="status-summary">
        <span class="muted">${status?.inSyncCount ?? 0} in sync, ${status?.outOfSyncCount ?? 0} out of sync</span>
      </section>
    </div>
  `
}
const renderWorkspaceBody = (): string => {
  if (!state.workspace) {
    return renderEmptyState()
  }

  if (state.workspace.status === 'not_initialized') {
    return renderNotInitializedState()
  }

  return renderReadyState()
}

const renderInitConfirmModal = (): string => {
  if (!state.workspace || state.workspace.status !== 'not_initialized' || !state.initConfirmOpen) {
    return ''
  }

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="init-workspace-modal-title">
        <div class="modal-icon" aria-hidden="true">${icon.warning}</div>
        <div class="modal-body">
          <h3 id="init-workspace-modal-title">Initialize workspace?</h3>
          <p>This will create <code>.mcpspace/config.yaml</code> in the selected workspace.</p>
          <p>You can edit the configuration after initialization.</p>
        </div>
        <div class="modal-actions">
          <button data-action="cancel-init-workspace" class="button secondary" ${disabledAttr(state.loading)}>Cancel</button>
          <button data-action="confirm-init-workspace" class="button primary" ${disabledAttr(state.loading)}><span class="button-icon">${icon.sparkles}</span><span>Initialize Workspace</span></button>
        </div>
      </section>
    </div>
  `
}


const bindActionHandlers = (): void => {
  document.querySelectorAll<HTMLButtonElement>('[data-action="open-workspace"]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openWorkspace()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="show-init-confirm"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.initConfirmOpen = true
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="confirm-init-workspace"]').forEach((button) => {
    button.addEventListener('click', async () => {
      state.initConfirmOpen = false
      render()
      await initializeWorkspace()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="cancel-init-workspace"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.initConfirmOpen = false
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-theme"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.theme = state.theme === 'light' ? 'dark' : 'light'
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="select-client"]').forEach((button) => {
    button.addEventListener('click', () => {
      const clientName = button.dataset.client as ClientId | undefined
      if (!clientName) {
        return
      }

      state.selectedClient = clientName
      render()
    })
  })

  document.querySelectorAll<HTMLInputElement>('[data-action="toggle-tool"]').forEach((input) => {
    input.addEventListener('change', () => {
      const toolName = input.dataset.tool
      if (!toolName) {
        return
      }

      toggleSelectedClientTool(toolName)
      render()
    })
  })
}
const render = (): void => {
  const badgeLabel = getWorkspaceBadgeLabel(state.workspace, state.status)
  const badgeClass = getWorkspaceBadgeClass(state.workspace, state.status)

  document.body.dataset.theme = state.theme

  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">mcpspace</div>
        <nav class="nav">
          <button class="nav-item active" type="button"><span class="nav-icon">${icon.folder}</span><span>Workspaces</span></button>
          <button class="nav-item" type="button"><span class="nav-icon">${icon.search}</span><span>Marketplace</span></button>
          <button class="nav-item" type="button"><span class="nav-icon">${icon.refresh}</span><span>Changes</span></button>
          <button class="nav-item" type="button"><span class="nav-icon">${icon.warning}</span><span>Doctor</span></button>
          <button class="nav-item" type="button"><span class="nav-icon">${icon.dots}</span><span>Settings</span></button>
        </nav>

        ${renderSidebarWorkspace()}

        <div class="sidebar-footer">
          <button data-action="open-workspace" class="button secondary sidebar-button"><span class="button-icon">${icon.folder}</span><span>Open Workspace Folder</span></button>
          <div class="sidebar-footer-row">
            <button data-action="toggle-theme" class="theme-toggle" type="button" aria-label="Toggle theme">
              <span class="theme-toggle-icon">${state.theme === 'light' ? icon.sun : icon.moon}</span>
              <span class="theme-toggle-track"><span class="theme-toggle-thumb"></span></span>
            </button>
            <div class="sidebar-version">v0.1.0</div>
          </div>
        </div>
      </aside>

      <main class="main">
        <header class="header">
          <div>
            <div class="eyebrow">Workspace</div>
            <div class="header-title-row">
              <h1>${state.workspace ? state.workspace.name : 'No workspace connected'}</h1>
              ${badgeLabel ? `<span class="${badgeClass}">${badgeLabel}</span>` : ''}
            </div>
            <p class="subtitle">${state.workspace ? state.workspace.path : 'Open a project folder to connect a workspace and start managing MCP tools for your AI clients.'}</p>
          </div>
          <div class="header-actions">
            <button class="button secondary sync-button" type="button" disabled aria-disabled="true"><span class="button-icon">${icon.refresh}</span><span>Sync Now</span></button>
            <button class="button secondary" type="button" aria-label="More options" disabled><span class="button-icon">${icon.dots}</span></button>
          </div>
        </header>

        ${state.error ? `<section class="card error-card"><strong>Error:</strong> ${state.error}</section>` : ''}
        ${renderWorkspaceBody()}
      </main>
    </div>
    ${renderInitConfirmModal()}
  `

  bindActionHandlers()
}


const applyReadyWorkspace = (workspaceStatus: WorkspaceStatusDto): void => {
  state.status = workspaceStatus
  state.selectedClient = getPreferredClientSelection(workspaceStatus.clients)
  state.draftAssignments = buildDraftAssignmentsFromStatus(workspaceStatus)
}

const clearReadyWorkspace = (): void => {
  state.status = null
  state.selectedClient = null
  state.draftAssignments = clearDraftAssignments()
}

const loadWorkspace = async (): Promise<void> => {
  state.loading = true
  state.error = null
  state.initConfirmOpen = false
  render()

  const currentResult = await window.mcpspace.workspace.current()
  if (!currentResult.ok) {
    state.error = currentResult.error.message
    state.workspace = null
    clearReadyWorkspace()
    state.loading = false
    render()
    return
  }

  state.workspace = currentResult.data

  if (currentResult.data?.status === 'ready') {
    const statusResult = await window.mcpspace.workspace.status()
    if (statusResult.ok) {
      applyReadyWorkspace(statusResult.data)
    } else {
      state.error = statusResult.error.message
      clearReadyWorkspace()
    }
  } else {
    clearReadyWorkspace()
  }

  state.loading = false
  render()
}

const openWorkspace = async (): Promise<void> => {
  state.loading = true
  state.error = null
  state.initConfirmOpen = false
  render()

  const result = await window.mcpspace.workspace.open()
  if (!result.ok) {
    state.error = result.error.message
    state.loading = false
    render()
    return
  }

  if (result.data === null) {
    state.loading = false
    await loadWorkspace()
    return
  }

  state.workspace = result.data

  if (state.workspace?.status === 'ready') {
    const statusResult = await window.mcpspace.workspace.status()
    if (statusResult.ok) {
      applyReadyWorkspace(statusResult.data)
    } else {
      state.error = statusResult.error.message
      clearReadyWorkspace()
    }
  } else {
    clearReadyWorkspace()
  }

  state.loading = false
  render()
}

const initializeWorkspace = async (): Promise<void> => {
  state.loading = true
  state.error = null
  render()

  const result = await window.mcpspace.workspace.init()
  if (!result.ok) {
    state.error = result.error.message
    state.loading = false
    state.initConfirmOpen = false
    render()
    return
  }

  state.workspace = result.data
  const statusResult = await window.mcpspace.workspace.status()
  if (statusResult.ok) {
    applyReadyWorkspace(statusResult.data)
  } else {
    state.error = statusResult.error.message
    clearReadyWorkspace()
  }

  state.loading = false
  state.initConfirmOpen = false
  render()
}

void loadWorkspace()
