import './styles/app.css'

import type { ClientId, ClientStatusDto, SyncPlanDto, WorkspaceContextDto, WorkspaceStatusDto } from '../../shared/dtos.js'

type ViewState = {
  workspace: WorkspaceContextDto | null
  status: WorkspaceStatusDto | null
  plan: SyncPlanDto | null
  loading: boolean
  error: string | null
  initConfirmOpen: boolean
  toolModalMode: 'add' | 'edit' | null
  toolModalOriginalName: string | null
  addToolModalOpen: boolean
  addToolName: string
  addToolCommand: string
  addToolArgs: string
  addToolPackage: string
  removeToolModalOpen: boolean
  removeToolName: string | null
  assignedClientsModalOpen: boolean
  assignedClientsToolName: string | null
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
  plan: null,
  loading: false,
  error: null,
  initConfirmOpen: false,
  toolModalMode: null,
  toolModalOriginalName: null,
  addToolModalOpen: false,
  addToolName: '',
  addToolCommand: 'npx',
  addToolArgs: '-y\n@modelcontextprotocol/server-filesystem\n.',
  addToolPackage: '',
  removeToolModalOpen: false,
  removeToolName: null,
  assignedClientsModalOpen: false,
  assignedClientsToolName: null,
  selectedClient: null,
  draftAssignments: {
    'claude-desktop': [],
    'claude-code': [],
    codex: [],
    cursor: [],
  },
  theme: 'light',
}

let planRequestId = 0

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

const refreshSelectedClientPlan = async (client: ClientId | null = getSelectedClient()): Promise<void> => {
  if (!client || !state.workspace || state.workspace.status !== 'ready') {
    state.plan = null
    render()
    return
  }

  const currentPlanRequestId = ++planRequestId
  state.plan = null
  render()

  const result = await window.mcpspace.workspace.plan(client)
  if (currentPlanRequestId !== planRequestId) {
    return
  }

  if (!result.ok) {
    state.error = result.error.message
    render()
    return
  }

  if (state.selectedClient === client || getSelectedClient() === client) {
    state.plan = result.data
  }

  render()
}

const syncSelectedClient = async (client: ClientId | null = getSelectedClient()): Promise<void> => {
  if (!client) {
    return
  }

  state.loading = true
  state.error = null
  render()

  const result = await window.mcpspace.workspace.sync(client)
  if (!result.ok) {
    state.error = result.error.message
    state.loading = false
    render()
    return
  }

  const statusResult = await window.mcpspace.workspace.status()
  if (statusResult.ok) {
    applyReadyWorkspace(statusResult.data)
    state.selectedClient = client
    await refreshSelectedClientPlan(client)
  } else {
    state.error = statusResult.error.message
  }

  state.loading = false
  render()
}

const refreshWorkspaceView = async (): Promise<void> => {
  state.loading = true
  state.error = null
  render()

  const currentResult = await window.mcpspace.workspace.current()
  if (!currentResult.ok) {
    state.error = currentResult.error.message
    state.loading = false
    render()
    return
  }

  const workspace = currentResult.data
  state.workspace = workspace

  if (!workspace || workspace.status !== 'ready') {
    state.status = null
    state.plan = null
    state.selectedClient = null
    state.draftAssignments = clearDraftAssignments()
    state.loading = false
    render()
    return
  }

  const statusResult = await window.mcpspace.workspace.status()
  if (statusResult.ok) {
    applyReadyWorkspace(statusResult.data)
    state.selectedClient = getSelectedClient()
    await refreshSelectedClientPlan(state.selectedClient)
  } else {
    state.error = statusResult.error.message
  }

  state.loading = false
  render()
}

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

const toggleSelectedClientTool = async (toolName: string): Promise<void> => {
  const selectedClient = getSelectedClient()
  if (!selectedClient) {
    return
  }

  const previousDraftAssignments = state.draftAssignments
  const currentTools = new Set(getDraftToolsForClient(selectedClient))
  const isAttached = currentTools.has(toolName)

  if (isAttached) {
    currentTools.delete(toolName)
  } else {
    currentTools.add(toolName)
  }

  const nextDraftAssignments = {
    ...state.draftAssignments,
    [selectedClient]: sortToolsByWorkspaceOrder(state.status, [...currentTools]),
  }

  state.draftAssignments = nextDraftAssignments
  state.loading = true
  state.error = null
  render()

  const result = isAttached
    ? await window.mcpspace.workspace.detach(toolName, selectedClient)
    : await window.mcpspace.workspace.attach(toolName, selectedClient)

  if (!result.ok) {
    state.draftAssignments = previousDraftAssignments
    state.error = result.error.message
    state.loading = false
    render()
    return
  }

  const statusResult = await window.mcpspace.workspace.status()
  if (statusResult.ok) {
    applyReadyWorkspace(statusResult.data)
    state.selectedClient = selectedClient
    await refreshSelectedClientPlan(selectedClient)
  } else {
    state.error = statusResult.error.message
  }

  state.loading = false
  render()
}

const renderProjectStrip = (workspace: WorkspaceContextDto): string => `
  <section class="project-strip card">
    <div class="project-strip-copy">
      <div class="strip-label">Project Path</div>
      <div class="strip-value">${workspace.path}</div>
    </div>
    <div class="project-strip-actions">
      <button data-action="copy-project-path" class="button secondary icon-button" type="button" aria-label="Copy project path" title="Copy project path" ${disabledAttr(state.loading)}><span class="button-icon">${icon.copy}</span></button>
      <button data-action="open-in-explorer" class="button secondary icon-button" type="button" aria-label="Open in Explorer" title="Open in Explorer" ${disabledAttr(state.loading)}><span class="button-icon">${icon.open}</span></button>
    </div>
  </section>
`
const copyCurrentProjectPath = async (): Promise<void> => {
  const workspace = state.workspace
  if (!workspace) {
    return
  }

  const result = await window.mcpspace.workspace.copyPath(workspace.path)
  if (!result.ok) {
    state.error = result.error.message
    render()
  }
}

const openCurrentProjectInExplorer = async (): Promise<void> => {
  const workspace = state.workspace
  if (!workspace) {
    return
  }

  const result = await window.mcpspace.workspace.openInExplorer(workspace.path)
  if (!result.ok) {
    state.error = result.error.message
    render()
  }
}

const openAddToolModal = (): void => {
  state.toolModalMode = 'add'
  state.toolModalOriginalName = null
  state.addToolModalOpen = true
  state.addToolName = ''
  state.addToolCommand = 'npx'
  state.addToolArgs = ''
  state.addToolPackage = ''
  state.error = null
  render()
}

const openEditToolModal = (tool: WorkspaceStatusDto['tools'][number]): void => {
  state.toolModalMode = 'edit'
  state.toolModalOriginalName = tool.toolName
  state.addToolModalOpen = true
  state.addToolName = tool.toolName
  state.addToolCommand = tool.command
  state.addToolArgs = tool.args.join('\n')
  state.addToolPackage = tool.package ?? ''
  state.error = null
  render()
}

const closeAddToolModal = (): void => {
  state.addToolModalOpen = false
  state.toolModalMode = null
  state.toolModalOriginalName = null
  render()
}

const saveTool = async (
  toolName: string,
  command: string,
  args: string[],
  toolPackage: string,
  mode: 'add' | 'edit' | null,
  originalName: string | null,
): Promise<void> => {
  if (!toolName || !command) {
    return
  }

  state.loading = true
  state.error = null
  render()

  const result =
    mode === 'edit' && originalName
      ? await window.mcpspace.workspace.mcpUpdate(originalName, toolName, {
          command,
          args,
          package: toolPackage,
        })
      : await window.mcpspace.workspace.mcpAdd(toolName, {
          command,
          args,
          package: toolPackage,
        })
  if (!result.ok) {
    state.error = result.error.message
    state.loading = false
    render()
    return
  }

  const statusResult = await window.mcpspace.workspace.status()
  if (statusResult.ok) {
    applyReadyWorkspace(statusResult.data)
    state.selectedClient = getSelectedClient()
    await refreshSelectedClientPlan(state.selectedClient)
  } else {
    state.error = statusResult.error.message
  }

  state.loading = false
  render()
}

const openRemoveToolModal = (toolName: string): void => {
  state.removeToolModalOpen = true
  state.removeToolName = toolName
  state.error = null
  render()
}

const closeRemoveToolModal = (): void => {
  state.removeToolModalOpen = false
  state.removeToolName = null
  render()
}

const openAssignedClientsModal = (toolName: string): void => {
  state.assignedClientsToolName = toolName
  state.assignedClientsModalOpen = true
  state.error = null
  render()
}

const closeAssignedClientsModal = (): void => {
  state.assignedClientsModalOpen = false
  state.assignedClientsToolName = null
  render()
}

const removeMcpTool = async (toolName: string): Promise<void> => {
  if (!toolName) {
    return
  }

  state.loading = true
  state.error = null
  render()

  const result = await window.mcpspace.workspace.mcpRemove(toolName)
  if (!result.ok) {
    state.error = result.error.message
    state.loading = false
    render()
    return
  }

  const statusResult = await window.mcpspace.workspace.status()
  if (statusResult.ok) {
    applyReadyWorkspace(statusResult.data)
    state.selectedClient = getSelectedClient()
    await refreshSelectedClientPlan(state.selectedClient)
  } else {
    state.error = statusResult.error.message
  }

  state.loading = false
  render()
}

const renderAddToolModal = (): string => {
  if (!state.addToolModalOpen) {
    return ''
  }

  const isEditMode = state.toolModalMode === 'edit'
  const title = isEditMode ? 'Edit MCP tool' : 'Add custom MCP tool'
  const description = isEditMode
    ? 'Update the workspace-level MCP tool entry and keep the same workspace registry item.'
    : 'Create a workspace-level MCP tool entry before assigning it to AI clients.'
  const primaryLabel = isEditMode ? 'Save Tool' : 'Add Tool'

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal modal-wide" role="dialog" aria-modal="true" aria-labelledby="add-tool-modal-title">
        <div class="modal-icon" aria-hidden="true">${icon.sparkles}</div>
        <div class="modal-body">
          <h3 id="add-tool-modal-title">${title}</h3>
          <p>${description}</p>
        </div>
        <div class="modal-form">
          <label class="modal-field">
            <span class="modal-field-label">Tool name</span>
            <input data-action="add-tool-name" class="modal-input" type="text" value="${state.addToolName}" placeholder="my-mcp" ${disabledAttr(state.loading)} />
          </label>
          <label class="modal-field">
            <span class="modal-field-label">Command</span>
            <input data-action="add-tool-command" class="modal-input" type="text" value="${state.addToolCommand}" placeholder="npx" ${disabledAttr(state.loading)} />
          </label>
          <label class="modal-field">
            <span class="modal-field-label">Args</span>
            <textarea data-action="add-tool-args" class="modal-textarea" rows="4" placeholder="-y&#10;@modelcontextprotocol/server-filesystem&#10;." ${disabledAttr(state.loading)}>${state.addToolArgs}</textarea>
          </label>
          <label class="modal-field">
            <span class="modal-field-label">Package</span>
            <input data-action="add-tool-package" class="modal-input" type="text" value="${state.addToolPackage}" placeholder="@modelcontextprotocol/server-filesystem" ${disabledAttr(state.loading)} />
          </label>
        </div>
        <div class="modal-actions">
          <button data-action="cancel-add-tool" class="button secondary" ${disabledAttr(state.loading)}>Cancel</button>
          <button data-action="confirm-add-tool" class="button primary" ${disabledAttr(state.loading)}><span class="button-icon">${icon.sparkles}</span><span>${primaryLabel}</span></button>
        </div>
      </section>
    </div>
  `
}

const renderRemoveToolModal = (): string => {
  if (!state.removeToolModalOpen || !state.removeToolName) {
    return ''
  }

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="remove-tool-modal-title">
        <div class="modal-icon modal-icon-danger" aria-hidden="true">${icon.warning}</div>
        <div class="modal-body">
          <h3 id="remove-tool-modal-title">Remove MCP tool?</h3>
          <p>This will remove <code>${state.removeToolName}</code> from the workspace registry.</p>
          <p>The tool will no longer be available for AI client assignment.</p>
        </div>
        <div class="modal-actions">
          <button data-action="cancel-remove-tool" class="button secondary" ${disabledAttr(state.loading)}>Cancel</button>
          <button data-action="confirm-remove-tool" class="button primary" ${disabledAttr(state.loading)}><span class="button-icon">${icon.dots}</span><span>Remove Tool</span></button>
        </div>
      </section>
    </div>
  `
}

const renderAssignedClientsModal = (): string => {
  if (!state.assignedClientsModalOpen || !state.assignedClientsToolName || !state.status) {
    return ''
  }

  const tool = state.status.tools.find((item) => item.toolName === state.assignedClientsToolName)
  if (!tool) {
    return ''
  }

  const assignedClients = tool.clients.map((client) => getClientDisplayName(client))

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="assigned-clients-modal-title">
        <div class="modal-icon" aria-hidden="true">${icon.warning}</div>
        <div class="modal-body">
          <h3 id="assigned-clients-modal-title">${tool.toolName} is used by</h3>
          ${
            assignedClients.length > 0
              ? `<div class="assigned-clients-list">${assignedClients.map((client) => `<span class="pill pill-success">${client}</span>`).join('')}</div>`
              : '<p>No AI clients are using this tool.</p>'
          }
        </div>
        <div class="modal-actions">
          <button data-action="close-assigned-clients" class="button secondary">Close</button>
        </div>
      </section>
    </div>
  `
}

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
  const selectedClientPlan = selectedClient ? state.plan : null
  const changeRows = selectedClientPlan?.actions ?? []

  return `
    <div class="workspace-stack">
      ${renderProjectStrip(workspace)}

      <section class="card panel registry-panel">
        <div class="panel-header panel-header-split">
          <div>
            <h2>Workspace MCP Tools</h2>
            <p class="muted">Manage the MCP tools registered in this workspace.</p>
          </div>
          <button data-action="add-custom-tool" class="button secondary toolbar-button" type="button"><span class="button-icon">${icon.sparkles}</span><span>Add Custom Tool</span></button>
        </div>

        <div class="registry-list">
          ${
            tools.length === 0
              ? '<div class="list-empty">No MCP tools registered.</div>'
              : tools
                  .map(
                    (tool) => `
                      <div class="registry-row">
                        <span class="tool-row-main">
                          <span class="tool-avatar tool-avatar-${tool.toolName}">${getToolAvatarLabel(tool.toolName)}</span>
                          <span class="tool-copy">
                            <span class="tool-name">${tool.toolName}</span>
                            <span class="tool-meta">${getToolDisplayName(tool.toolName)}</span>
                          </span>
                        </span>
                        <span class="registry-actions">
                          <span class="pill pill-neutral">Registered</span>
                          ${
                            tool.clients.length > 0
                              ? `<button type="button" class="assigned-clients-pill" data-action="open-assigned-clients" data-tool="${tool.toolName}" title="Used by ${tool.clients.map((client) => getClientDisplayName(client)).join(', ')}"><span class="assigned-dot"></span><span>Used by ${tool.clients.length} AI${tool.clients.length === 1 ? '' : 's'}</span></button>`
                              : ''
                          }
                          <button data-action="edit-mcp" data-tool="${tool.toolName}" class="button secondary registry-action toolbar-button" type="button" title="Edit MCP tool"><span>Edit</span></button>
                          <button data-action="remove-mcp" data-tool="${tool.toolName}" class="button danger registry-action toolbar-button" type="button" ${disabledAttr(tool.clients.length > 0)} title="${tool.clients.length > 0 ? `Assigned to ${tool.clients.map((client) => getClientDisplayName(client)).join(', ')}` : 'Remove MCP tool'}"><span>Remove</span></button>
                        </span>
                      </div>
                    `,
                  )
                  .join('')
          }
        </div>
      </section>

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
                                    ${disabledAttr(state.loading)}
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
        </div>

        <div class="changes-list">
          ${
            selectedClient
              ? selectedClientPlan
                ? changeRows.length === 0
                  ? '<div class="changes-empty">No changes to apply.</div>'
                  : changeRows
                      .map(
                        (action) => {
                          if (action.type === 'create') {
                            return `
                              <div class="change-row change-attach">
                                <span class="change-icon">↑</span>
                                <span>Attach <strong>${action.toolName}</strong> to <strong>${selectedClientLabel}</strong></span>
                                <span class="pill pill-success">Attach</span>
                              </div>
                            `
                          }

                          if (action.type === 'update') {
                            return `
                              <div class="change-row change-update">
                                <span class="change-icon">↻</span>
                                <span>Update <strong>${action.toolName}</strong> for <strong>${selectedClientLabel}</strong></span>
                                <span class="pill pill-warning">Update</span>
                              </div>
                            `
                          }

                          if (action.type === 'delete') {
                            return `
                              <div class="change-row change-detach">
                                <span class="change-icon">↓</span>
                                <span>Detach <strong>${action.toolName}</strong> from <strong>${selectedClientLabel}</strong></span>
                                <span class="pill pill-warning">Detach</span>
                              </div>
                            `
                          }

                          return `
                            <div class="change-row change-noop">
                              <span class="change-icon">•</span>
                              <span>No change for <strong>${action.toolName}</strong></span>
                              <span class="pill pill-neutral">No Change</span>
                            </div>
                          `
                        },
                      )
                      .join('')
                : '<div class="changes-empty">Loading changes...</div>'
              : '<div class="changes-empty">Select an AI client to review changes.</div>'
          }
        </div>

        ${selectedClientPlan ? `<div class="changes-summary muted">${selectedClientPlan.summary.create} create, ${selectedClientPlan.summary.update} update, ${selectedClientPlan.summary.delete} delete, ${selectedClientPlan.summary.noop} no change</div>` : ''}

        <div class="changes-footer">
          <button data-action="refresh-plan" class="button secondary" type="button" ${disabledAttr(state.loading || !selectedClient)}><span class="button-icon">${icon.search}</span><span>Review Changes</span></button>
          <button data-action="sync-client" class="button primary" type="button" ${disabledAttr(state.loading || !selectedClient)}><span class="button-icon">${icon.refresh}</span><span>Apply Changes</span></button>
        </div>
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

  document.querySelectorAll<HTMLButtonElement>('[data-action="copy-project-path"]').forEach((button) => {
    button.addEventListener('click', async () => {
      await copyCurrentProjectPath()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="open-in-explorer"]').forEach((button) => {
    button.addEventListener('click', async () => {
      await openCurrentProjectInExplorer()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="add-custom-tool"]').forEach((button) => {
    button.addEventListener('click', () => {
      openAddToolModal()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="edit-mcp"]').forEach((button) => {
    button.addEventListener('click', () => {
      const toolName = button.dataset.tool
      if (!toolName || !state.status) {
        return
      }

      const tool = state.status.tools.find((item) => item.toolName === toolName)
      if (!tool) {
        return
      }

      openEditToolModal(tool)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="remove-mcp"]').forEach((button) => {
    button.addEventListener('click', () => {
      const toolName = button.dataset.tool
      if (!toolName) {
        return
      }

      openRemoveToolModal(toolName)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="open-assigned-clients"]').forEach((button) => {
    button.addEventListener('click', () => {
      const toolName = button.dataset.tool
      if (!toolName) {
        return
      }

      openAssignedClientsModal(toolName)
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

  document.querySelectorAll<HTMLButtonElement>('[data-action="confirm-add-tool"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const mode = state.toolModalMode
      const originalName = state.toolModalOriginalName
      const toolName = state.addToolName.trim()
      const command = state.addToolCommand.trim()
      const args = state.addToolArgs
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
      const toolPackage = state.addToolPackage.trim()

      closeAddToolModal()
      await saveTool(toolName, command, args, toolPackage, mode, originalName)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="cancel-add-tool"]').forEach((button) => {
    button.addEventListener('click', () => {
      closeAddToolModal()
    })
  })

  document.querySelectorAll<HTMLInputElement>('[data-action="add-tool-name"]').forEach((input) => {
    input.addEventListener('input', () => {
      state.addToolName = input.value
    })
  })

  document.querySelectorAll<HTMLInputElement>('[data-action="add-tool-command"]').forEach((input) => {
    input.addEventListener('input', () => {
      state.addToolCommand = input.value
    })
  })

  document.querySelectorAll<HTMLInputElement>('[data-action="add-tool-package"]').forEach((input) => {
    input.addEventListener('input', () => {
      state.addToolPackage = input.value
    })
  })

  document.querySelectorAll<HTMLTextAreaElement>('[data-action="add-tool-args"]').forEach((textarea) => {
    textarea.addEventListener('input', () => {
      state.addToolArgs = textarea.value
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="confirm-remove-tool"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const toolName = state.removeToolName?.trim()
      closeRemoveToolModal()
      if (!toolName) {
        return
      }

      await removeMcpTool(toolName)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="cancel-remove-tool"]').forEach((button) => {
    button.addEventListener('click', () => {
      closeRemoveToolModal()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="close-assigned-clients"]').forEach((button) => {
    button.addEventListener('click', () => {
      closeAssignedClientsModal()
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
      void refreshSelectedClientPlan(clientName)
    })
  })

  document.querySelectorAll<HTMLInputElement>('[data-action="toggle-tool"]').forEach((input) => {
    input.addEventListener('change', () => {
      const toolName = input.dataset.tool
      if (!toolName) {
        return
      }

      void toggleSelectedClientTool(toolName)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="refresh-plan"]').forEach((button) => {
    button.addEventListener('click', () => {
      void refreshSelectedClientPlan()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="sync-client"]').forEach((button) => {
    button.addEventListener('click', () => {
      void syncSelectedClient()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="refresh-workspace"]').forEach((button) => {
    button.addEventListener('click', () => {
      void refreshWorkspaceView()
    })
  })
}
const render = (): void => {
  const selectedClient = getSelectedClient()
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
            <button data-action="refresh-workspace" class="button secondary sync-button toolbar-button" type="button" ${disabledAttr(state.loading)}><span class="button-icon">${icon.refresh}</span><span>Refresh</span></button>
            <button class="button secondary" type="button" aria-label="More options" disabled><span class="button-icon">${icon.dots}</span></button>
          </div>
        </header>

        ${state.error ? `<section class="card error-card"><strong>Error:</strong> ${state.error}</section>` : ''}
        ${renderWorkspaceBody()}
      </main>
    </div>
    ${renderInitConfirmModal()}
    ${renderAddToolModal()}
    ${renderRemoveToolModal()}
    ${renderAssignedClientsModal()}
  `

  bindActionHandlers()
}


const applyReadyWorkspace = (workspaceStatus: WorkspaceStatusDto): void => {
  state.status = workspaceStatus
  state.selectedClient = getPreferredClientSelection(workspaceStatus.clients)
  state.draftAssignments = buildDraftAssignmentsFromStatus(workspaceStatus)
  state.plan = null
}

const clearReadyWorkspace = (): void => {
  state.status = null
  state.plan = null
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
      await refreshSelectedClientPlan()
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
      await refreshSelectedClientPlan()
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
    await refreshSelectedClientPlan()
  } else {
    state.error = statusResult.error.message
    clearReadyWorkspace()
  }

  state.loading = false
  state.initConfirmOpen = false
  render()
}

void loadWorkspace()
