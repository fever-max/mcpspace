import './styles/app.css'
import brandLogoUrl from './assets/logo.png?url'
import { getLanguage, initLanguage, setLanguage, t, type Lang } from './i18n.js'

import type {
  ClientId,
  ClientStatusDto,
  McpCatalogEntryDto,
  SyncPlanDto,
  WorkspaceContextDto,
  WorkspaceStatusDto,
} from '../../shared/dtos.js'

type ViewState = {
  activeSection: 'workspaces' | 'marketplace' | 'doctor' | 'settings'
  workspace: WorkspaceContextDto | null
  status: WorkspaceStatusDto | null
  plan: SyncPlanDto | null
  loading: boolean
  error: string | null
  workspaceHelpOpen: boolean
  initConfirmOpen: boolean
  toolModalMode: 'add' | 'edit' | null
  toolModalOriginalName: string | null
  addToolModalOpen: boolean
  addToolModalTab: 'catalog' | 'manual'
  addToolName: string
  addToolCommand: string
  addToolArgs: string
  addToolPackage: string
  catalogTools: McpCatalogEntryDto[]
  catalogLoading: boolean
  catalogSearch: string
  catalogSelectedToolNames: string[]
  removeToolModalOpen: boolean
  removeToolName: string | null
  assignedClientsModalOpen: boolean
  assignedClientsToolName: string | null
  selectedClient: ClientId | null
  draftAssignments: Record<ClientId, string[]>
  themeMode: 'system' | 'light' | 'dark'
  theme: 'light' | 'dark'
  lang: Lang
  autoOpenLastWorkspace: boolean
  confirmBeforeSync: boolean
  autoBackupBeforeApply: boolean
  syncConfirmOpen: boolean
  syncConfirmClient: ClientId | null
}

type AppSettings = {
  themeMode: 'system' | 'light' | 'dark'
  lang: Lang
  autoOpenLastWorkspace: boolean
  confirmBeforeSync: boolean
  autoBackupBeforeApply: boolean
}

const SETTINGS_STORAGE_KEY = 'mcpspace.settings'
const root = document.querySelector<HTMLDivElement>('#app')

if (!root) {
  throw new Error('App root not found')
}

const readSettings = (): AppSettings => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) {
      return {
        themeMode: 'system',
        lang: initLanguage(),
        autoOpenLastWorkspace: true,
        confirmBeforeSync: true,
        autoBackupBeforeApply: true,
      }
    }

    const parsed = JSON.parse(raw) as Partial<AppSettings>
    const lang: Lang = parsed.lang === 'ko' ? 'ko' : 'en'
    return {
      themeMode: parsed.themeMode === 'light' || parsed.themeMode === 'dark' ? parsed.themeMode : 'system',
      lang,
      autoOpenLastWorkspace: parsed.autoOpenLastWorkspace !== false,
      confirmBeforeSync: parsed.confirmBeforeSync !== false,
      autoBackupBeforeApply: parsed.autoBackupBeforeApply !== false,
    }
  } catch {
    return {
      themeMode: 'system',
      lang: initLanguage(),
      autoOpenLastWorkspace: true,
      confirmBeforeSync: true,
      autoBackupBeforeApply: true,
    }
  }
}

const persistSettings = (): void => {
  localStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({
      themeMode: state.themeMode,
      lang: state.lang,
      autoOpenLastWorkspace: state.autoOpenLastWorkspace,
      confirmBeforeSync: state.confirmBeforeSync,
      autoBackupBeforeApply: state.autoBackupBeforeApply,
    } satisfies AppSettings),
  )
  setLanguage(state.lang)
}

const initialSettings = readSettings()

setLanguage(initialSettings.lang)

const getSystemTheme = (): 'light' | 'dark' => {
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }

  return 'light'
}

const resolveTheme = (themeMode: ViewState['themeMode']): 'light' | 'dark' => {
  if (themeMode === 'system') {
    return getSystemTheme()
  }

  return themeMode
}

const state: ViewState = {
  activeSection: 'workspaces',
  workspace: null,
  status: null,
  plan: null,
  loading: false,
  error: null,
  workspaceHelpOpen: false,
  initConfirmOpen: false,
  toolModalMode: null,
  toolModalOriginalName: null,
  addToolModalOpen: false,
  addToolModalTab: 'catalog',
  addToolName: '',
  addToolCommand: 'npx',
  addToolArgs: '-y\n@modelcontextprotocol/server-filesystem\n.',
  addToolPackage: '',
  catalogTools: [],
  catalogLoading: false,
  catalogSearch: '',
  catalogSelectedToolNames: [],
  removeToolModalOpen: false,
  removeToolName: null,
  assignedClientsModalOpen: false,
  assignedClientsToolName: null,
  selectedClient: null,
  draftAssignments: {
    'claude-code': [],
    codex: [],
    cursor: [],
  },
  themeMode: initialSettings.themeMode,
  theme: resolveTheme(initialSettings.themeMode),
  lang: initialSettings.lang,
  autoOpenLastWorkspace: initialSettings.autoOpenLastWorkspace,
  confirmBeforeSync: initialSettings.confirmBeforeSync,
  autoBackupBeforeApply: initialSettings.autoBackupBeforeApply,
  syncConfirmOpen: false,
  syncConfirmClient: null,
}

const applyThemeMode = (themeMode: ViewState['themeMode']): void => {
  state.themeMode = themeMode
  state.theme = resolveTheme(themeMode)
  persistSettings()
}

const themeMediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)')

themeMediaQuery?.addEventListener('change', () => {
  if (state.themeMode === 'system') {
    state.theme = resolveTheme('system')
    render()
  }
})

let planRequestId = 0

type RecentWorkspace = {
  path: string
  name: string
}

const RECENT_WORKSPACES_STORAGE_KEY = 'mcpspace.recent-workspaces'
const LAST_WORKSPACE_STORAGE_KEY = 'mcpspace.last-workspace'

const disabledAttr = (value: boolean): string => (value ? 'disabled aria-disabled="true"' : '')

const readRecentWorkspaces = (): RecentWorkspace[] => {
  try {
    const raw = localStorage.getItem(RECENT_WORKSPACES_STORAGE_KEY)
    if (!raw) {
      return []
    }

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (item): item is RecentWorkspace =>
        Boolean(item)
        && typeof item === 'object'
        && typeof (item as RecentWorkspace).path === 'string'
        && typeof (item as RecentWorkspace).name === 'string',
    )
  } catch {
    return []
  }
}

const writeRecentWorkspaces = (workspaces: RecentWorkspace[]): void => {
  localStorage.setItem(RECENT_WORKSPACES_STORAGE_KEY, JSON.stringify(workspaces))
}

const readLastWorkspacePath = (): string | null => {
  try {
    const raw = localStorage.getItem(LAST_WORKSPACE_STORAGE_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown
    return typeof parsed === 'string' ? parsed : null
  } catch {
    return null
  }
}

const writeLastWorkspacePath = (path: string): void => {
  localStorage.setItem(LAST_WORKSPACE_STORAGE_KEY, JSON.stringify(path))
}

const rememberWorkspace = (workspace: WorkspaceContextDto | null): void => {
  if (!workspace) {
    return
  }

  const recentWorkspaces = readRecentWorkspaces()
  const next = recentWorkspaces.some((item) => item.path === workspace.path)
    ? recentWorkspaces.map((item) => (item.path === workspace.path ? { path: workspace.path, name: workspace.name } : item))
    : [...recentWorkspaces, { path: workspace.path, name: workspace.name }].slice(-5)

  writeRecentWorkspaces(next)
  writeLastWorkspacePath(workspace.path)
}

const icon = {
  folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.75A2.25 2.25 0 0 1 5.25 4.5h4.39c.6 0 1.17.24 1.59.66l1.15 1.14c.42.42.99.66 1.59.66h5.83A2.25 2.25 0 0 1 22 9.21v7.54A2.25 2.25 0 0 1 19.75 19H5.25A2.25 2.25 0 0 1 3 16.75V6.75Z" fill="currentColor"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="10" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7 15H6A2 2 0 0 1 4 13V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  sparkles: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 2.5 11 7l4.5 1.5L11 10l-1.5 4.5L8 10 3.5 8.5 8 7l1.5-4.5ZM17.5 12.5 18.5 15l2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5ZM16 3.5 16.7 5l1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7.7-1.5Z" fill="currentColor"/></svg>',
  open: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 3h7v7h-2V6.41l-8.29 8.3-1.42-1.42 8.3-8.29H14V3ZM5 5h6v2H7v10h10v-4h2v6H5V5Z" fill="currentColor"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.5 4a6.5 6.5 0 1 0 4.09 11.54l4.94 4.94 1.41-1.41-4.94-4.94A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z" fill="currentColor"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17.65 6.35A8 8 0 1 0 20 12h-2a6 6 0 1 1-1.76-4.24L14 10h6V4l-2.35 2.35Z" fill="currentColor"/></svg>',
  dots: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/></svg>',
  sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V5a1 1 0 0 1 1-1Zm0 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm8-5a1 1 0 0 1-1 1h-1a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1ZM6 12a1 1 0 0 1-1 1H4a1 1 0 1 1 0-2h1a1 1 0 0 1 1 1Zm10.95-5.95a1 1 0 0 1 1.41 0l.7.7a1 1 0 1 1-1.41 1.41l-.7-.7a1 1 0 0 1 0-1.41ZM6.34 17.66a1 1 0 0 1 1.41 0l.7.7a1 1 0 0 1-1.41 1.41l-.7-.7a1 1 0 0 1 0-1.41Zm11.72 1.41a1 1 0 0 1 0-1.41l.7-.7a1 1 0 1 1 1.41 1.41l-.7.7a1 1 0 0 1-1.41 0ZM6.34 6.34a1 1 0 0 1 0-1.41l.7-.7a1 1 0 0 1 1.41 1.41l-.7.7a1 1 0 0 1-1.41 0Z" fill="currentColor"/></svg>',
  moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.2A8.8 8.8 0 1 1 11.8 3a7 7 0 0 0 9.2 9.2Z" fill="currentColor"/></svg>',
  book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2h10A2.5 2.5 0 0 1 20 4.5v15A2.5 2.5 0 0 1 17.5 22H7a3 3 0 0 1-3-3V4.5Zm2.5-.5A.5.5 0 0 0 7 4.5V19a1 1 0 0 0 1 1h9.5a.5.5 0 0 0 .5-.5v-15a.5.5 0 0 0-.5-.5h-10Z" fill="currentColor"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
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


const clientOrder: ClientId[] = ['codex', 'claude-code', 'cursor']

const clientDisplayNames: Record<ClientId, string> = {
  'claude-code': 'Claude Code',
  codex: 'Codex',
  cursor: 'Cursor',
}

const clientAvatarLabels: Record<ClientId, string> = {
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
const formatInitializeWorkspaceInfoBody = (): string => {
  const text = t('common.initializeWorkspaceInfoBody')
  return text
    .replace('.mcpspace', '<code>.mcpspace</code>')
    .replace('config.yaml', '<code>config.yaml</code>')
}
const formatUsedByLabel = (count: number): string => {
  if (getLanguage() === 'ko') {
    return `AI ${count}개 사용 중`
  }

  return `Used by ${count} AI${count === 1 ? '' : 's'}`
}

const formatAssignedClientsTitle = (clients: string[]): string => {
  if (clients.length === 0) {
    return t('common.noAisUsingTool')
  }

  if (getLanguage() === 'ko') {
    return `이 도구는 ${clients.join(', ')}가 사용 중입니다.`
  }

  return `Used by ${clients.join(', ')}`
}

const getPreferredClientSelection = (clients: ClientStatusDto[]): ClientId | null => {
  for (const clientId of clientOrder) {
    if (clients.some((client) => client.clientName === clientId)) {
      return clientId
    }
  }

  return null
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
  'claude-code': sortToolsByWorkspaceOrder(status, getActualAssignmentsForClient(status, 'claude-code')),
  codex: sortToolsByWorkspaceOrder(status, getActualAssignmentsForClient(status, 'codex')),
  cursor: sortToolsByWorkspaceOrder(status, getActualAssignmentsForClient(status, 'cursor')),
})

const clearDraftAssignments = (): Record<ClientId, string[]> => ({
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

  const result = await window.mcpspace.workspace.sync(client, { backup: state.autoBackupBeforeApply })
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

const requestSyncSelectedClient = (client: ClientId | null = getSelectedClient()): void => {
  if (!client) {
    return
  }

  if (state.confirmBeforeSync) {
    state.syncConfirmOpen = true
    state.syncConfirmClient = client
    render()
    return
  }

  void syncSelectedClient(client)
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
    return t('common.notConfigured')
  }

  return client.outOfSync ? t('common.outOfSync') : t('common.inSync')
}

const getClientStatusClass = (client: ClientStatusDto): string => {
  if (client.assignedMcpCount === 0) {
    return 'pill pill-neutral'
  }

  return client.outOfSync ? 'pill pill-warning' : 'pill pill-success'
}

const getFixedClientStatus = (clientName: ClientId): ClientStatusDto | null => {
  const status = state.status?.clients.find((client) => client.clientName === clientName)
  return status ?? null
}

const getClientRowStatusLabel = (clientName: ClientId): string => {
  const client = getFixedClientStatus(clientName)
  if (!client) {
    return t('common.notConfigured')
  }

  return getClientStatusLabel(client)
}

const getClientRowStatusClass = (clientName: ClientId): string => {
  const client = getFixedClientStatus(clientName)
  if (!client) {
    return 'pill pill-neutral'
  }

  return getClientStatusClass(client)
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

const refreshCatalogTools = async (): Promise<void> => {
  if (!state.addToolModalOpen || state.toolModalMode !== 'add') {
    return
  }

  state.catalogLoading = true
  render()

  const result = await window.mcpspace.workspace.catalogList()
  if (!result.ok) {
    if (!state.addToolModalOpen || state.toolModalMode !== 'add') {
      return
    }

    state.error = result.error.message
    state.catalogLoading = false
    render()
    return
  }

  if (!state.addToolModalOpen || state.toolModalMode !== 'add') {
    return
  }

  state.catalogTools = result.data.items
  state.catalogLoading = false
  render()
}

const toggleCatalogTool = (tool: McpCatalogEntryDto): void => {
  if (tool.isRegistered || state.loading) {
    return
  }

  const exists = state.catalogSelectedToolNames.includes(tool.toolName)
  state.catalogSelectedToolNames = exists
    ? state.catalogSelectedToolNames.filter((name) => name !== tool.toolName)
    : [...state.catalogSelectedToolNames, tool.toolName]

  if (!exists) {
    state.addToolName = tool.toolName
    state.addToolCommand = tool.command
    state.addToolArgs = tool.args.join('\n')
    state.addToolPackage = tool.package
  }

  state.error = null
  render()
}

const getSelectedCatalogTools = (): McpCatalogEntryDto[] =>
  state.catalogTools.filter((tool) => state.catalogSelectedToolNames.includes(tool.toolName))

const openAddToolModal = (): void => {
  state.toolModalMode = 'add'
  state.toolModalOriginalName = null
  state.addToolModalOpen = true
  state.addToolModalTab = 'catalog'
  state.addToolName = ''
  state.addToolCommand = 'npx'
  state.addToolArgs = ''
  state.addToolPackage = ''
  state.catalogTools = []
  state.catalogLoading = true
  state.catalogSearch = ''
  state.catalogSelectedToolNames = []
  state.error = null
  render()
  void refreshCatalogTools()
}

const openEditToolModal = (tool: WorkspaceStatusDto['tools'][number]): void => {
  state.toolModalMode = 'edit'
  state.toolModalOriginalName = tool.toolName
  state.addToolModalOpen = true
  state.addToolModalTab = 'manual'
  state.addToolName = tool.toolName
  state.addToolCommand = tool.command
  state.addToolArgs = tool.args.join('\n')
  state.addToolPackage = tool.package ?? ''
  state.catalogSelectedToolNames = []
  state.error = null
  render()
}

const closeAddToolModal = (): void => {
  state.addToolModalOpen = false
  state.toolModalMode = null
  state.toolModalOriginalName = null
  state.addToolModalTab = 'catalog'
  state.catalogTools = []
  state.catalogLoading = false
  state.catalogSearch = ''
  state.catalogSelectedToolNames = []
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

const getFilteredCatalogTools = (): McpCatalogEntryDto[] => {
  const query = state.catalogSearch.trim().toLowerCase()
  const items = state.catalogTools.length > 0 ? state.catalogTools : []

  if (!query) {
    return items
  }

  return items.filter((tool) => {
    const haystack = [tool.toolName, tool.package, tool.description].join(' ').toLowerCase()
    return haystack.includes(query)
  })
}

const renderMcpManualForm = (primaryLabel: string, title: string, description: string, showTabs = false): string => `
  <div class="modal-backdrop" role="presentation">
    <section class="modal modal-wide modal-add-mcp" role="dialog" aria-modal="true" aria-labelledby="add-tool-modal-title">
      <button class="modal-close" data-action="cancel-add-tool" type="button" aria-label="${t('common.close')}">×</button>
      <div class="modal-body modal-body-left">
        <h3 id="add-tool-modal-title">${title}</h3>
        <p>${description}</p>
      </div>
      ${
        showTabs
          ? `<div class="modal-tabs settings-segment settings-segment-theme modal-tabs-wide" role="tablist" aria-label="${t('common.addMcpMode')}">
              <button data-action="switch-add-tool-tab" data-tab="catalog" class="settings-segment-button${state.addToolModalTab === 'catalog' ? ' active' : ''}" type="button">${t('common.fromCatalog')}</button>
              <button data-action="switch-add-tool-tab" data-tab="manual" class="settings-segment-button${state.addToolModalTab === 'manual' ? ' active' : ''}" type="button">${t('common.manualInput')}</button>
            </div>`
          : ''
      }
      <div class="modal-form">
        <label class="modal-field">
          <span class="modal-field-label">${t('common.toolName')}</span>
          <input data-action="add-tool-name" class="modal-input" type="text" value="${state.addToolName}" placeholder="my-mcp" ${disabledAttr(state.loading)} />
        </label>
        <label class="modal-field">
          <span class="modal-field-label">${t('common.command')}</span>
          <input data-action="add-tool-command" class="modal-input" type="text" value="${state.addToolCommand}" placeholder="npx" ${disabledAttr(state.loading)} />
        </label>
        <label class="modal-field">
          <span class="modal-field-label">${t('common.args')}</span>
          <textarea data-action="add-tool-args" class="modal-textarea" rows="4" placeholder="-y&#10;@modelcontextprotocol/server-filesystem&#10;." ${disabledAttr(state.loading)}>${state.addToolArgs}</textarea>
        </label>
        <label class="modal-field">
          <span class="modal-field-label">${t('common.package')}</span>
          <input data-action="add-tool-package" class="modal-input" type="text" value="${state.addToolPackage}" placeholder="@modelcontextprotocol/server-filesystem" ${disabledAttr(state.loading)} />
        </label>
      </div>
      <div class="modal-actions modal-actions-right">
        <button data-action="cancel-add-tool" class="button secondary" ${disabledAttr(state.loading)}>${t('sync.confirm.cancel')}</button>
        <button data-action="confirm-add-tool" class="button primary" ${disabledAttr(state.loading)}>${primaryLabel}</button>
      </div>
    </section>
  </div>
`

const renderCatalogMcpModal = (): string => {
  const filteredTools = getFilteredCatalogTools()
  const selectedTools = getSelectedCatalogTools()
  const primaryDisabled = state.loading || state.catalogLoading || selectedTools.length === 0

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal modal-wide modal-add-mcp modal-add-mcp-catalog" role="dialog" aria-modal="true" aria-labelledby="add-tool-modal-title">
        <button class="modal-close" data-action="cancel-add-tool" type="button" aria-label="${t('common.close')}">×</button>
        <div class="modal-body modal-body-left">
          <h3 id="add-tool-modal-title">${t('common.addMcp')}</h3>
          <p>${t('common.chooseCatalogMcpToPrefill')}</p>
        </div>
        <div class="modal-tabs settings-segment settings-segment-theme modal-tabs-wide" role="tablist" aria-label="${t('common.addMcpMode')}">
          <button data-action="switch-add-tool-tab" data-tab="catalog" class="settings-segment-button${state.addToolModalTab === 'catalog' ? ' active' : ''}" type="button">${t('common.fromCatalog')}</button>
          <button data-action="switch-add-tool-tab" data-tab="manual" class="settings-segment-button${state.addToolModalTab === 'manual' ? ' active' : ''}" type="button">${t('common.manualInput')}</button>
        </div>
        <div class="modal-catalog">
          <label class="modal-field modal-search-field">
            <span class="modal-field-label">${t('common.searchMcp')}</span>
            <input data-action="catalog-search" class="modal-input" type="text" value="${state.catalogSearch}" placeholder="${t('common.searchMcp')}" ${disabledAttr(state.loading)} />
          </label>
          ${
            state.catalogLoading
              ? `<div class="catalog-loading">${t('common.catalogLoading')}</div>`
              : filteredTools.length === 0
                ? `<div class="catalog-empty">${t('common.noCatalogMatches')}</div>`
                : `
                  <div class="catalog-list">
                    ${filteredTools
                      .map((tool) => {
                        const selected = state.catalogSelectedToolNames.includes(tool.toolName)
                        const disabled = tool.isRegistered || state.loading
                        return `
                          <button
                            type="button"
                            class="catalog-row${selected ? ' selected' : ''}${disabled ? ' disabled' : ''}"
                            data-action="select-catalog-tool"
                            data-tool="${tool.toolName}"
                            ${disabledAttr(disabled)}
                            title="${tool.isRegistered ? t('common.catalogAlreadyRegistered') : tool.description}"
                          >
                            <span class="tool-row-main">
                              <span class="tool-avatar tool-avatar-${tool.toolName}">${getToolAvatarLabel(tool.toolName)}</span>
                              <span class="tool-copy">
                                <span class="tool-name">${tool.toolName}</span>
                                <span class="tool-meta">${tool.description}</span>
                              </span>
                            </span>
                            <span class="catalog-row-side">
                              <span class="catalog-package">${tool.package}</span>
                              ${
                                tool.isRegistered
                                  ? `<span class="pill pill-neutral">${t('common.registered')}</span>`
                                  : selected
                                    ? `<span class="catalog-check" aria-hidden="true">✓</span>`
                                    : `<span class="catalog-check catalog-check-empty" aria-hidden="true"></span>`
                              }
                            </span>
                          </button>
                        `
                      })
                      .join('')}
                  </div>
                `
          }
          ${
            selectedTools.length > 0
              ? `
                <div class="catalog-selection-summary">
                  <span class="muted">${t('common.selectedCatalogMcps')}</span>
                  <strong>${selectedTools.length}</strong>
                  <span class="muted">${selectedTools.map((tool) => tool.toolName).join(', ')}</span>
                </div>
              `
              : ''
          }
        </div>
        <div class="modal-actions modal-actions-right">
          <button data-action="cancel-add-tool" class="button secondary" ${disabledAttr(state.loading)}>${t('sync.confirm.cancel')}</button>
          <button data-action="confirm-add-tool" class="button primary" ${disabledAttr(primaryDisabled)}>${t('common.addSelected')}</button>
        </div>
      </section>
    </div>
  `
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
  if (isEditMode) {
    return renderMcpManualForm(
      'Save Tool',
      t('common.editMcpTool'),
      'Update the workspace-level MCP tool entry and keep the same workspace registry item.',
    )
  }

  if (state.addToolModalTab === 'manual') {
    return renderMcpManualForm(
      t('common.addMcp'),
      t('common.addMcp'),
      t('common.addMcpDescription'),
      true,
    )
  }

  return renderCatalogMcpModal()
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
          <h3 id="remove-tool-modal-title">${t('common.removeMcpToolQuestion')}</h3>
          <p>${t('common.removeMcpToolDescription')} <code>${state.removeToolName}</code>.</p>
        </div>
        <div class="modal-actions">
          <button data-action="cancel-remove-tool" class="button secondary" ${disabledAttr(state.loading)}>${t('common.close')}</button>
          <button data-action="confirm-remove-tool" class="button primary" ${disabledAttr(state.loading)}>${t('common.remove')}</button>
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
          <h3 id="assigned-clients-modal-title">${formatAssignedClientsTitle(assignedClients)}</h3>
          ${
            assignedClients.length > 0
              ? `<div class="assigned-clients-list">${assignedClients.map((client) => `<span class="pill pill-success">${client}</span>`).join('')}</div>`
              : `<p>${t('common.noAisUsingTool')}</p>`
          }
        </div>
        <div class="modal-actions">
          <button data-action="close-assigned-clients" class="button secondary">${t('common.close')}</button>
        </div>
      </section>
    </div>
  `
}

const renderSidebarWorkspace = (): string => {
  const recentWorkspaces = readRecentWorkspaces()
  const workspaceItems = recentWorkspaces

  if (workspaceItems.length === 0) {
    return `
      <section class="sidebar-workspaces empty">
        <div class="sidebar-workspaces-heading">${t('common.workspaces')}</div>
        <div class="sidebar-empty-title">${t('common.noWorkspacesYet')}</div>
        <div class="sidebar-empty-subtitle">${t('common.openWorkspaceToGetStarted')}</div>
      </section>
    `
  }

  return `
    <section class="sidebar-workspaces">
      <div class="sidebar-workspaces-heading">${t('common.workspaces')}</div>
      ${workspaceItems
        .map(
          (workspace) => `
            <button
              class="sidebar-workspace-item${state.workspace?.path === workspace.path ? ' active' : ''}"
              type="button"
              data-action="open-workspace-path"
              data-path="${workspace.path}"
            >
              <span class="sidebar-workspace-icon">${icon.folder}</span>
              <span class="sidebar-workspace-meta">
                <span class="sidebar-workspace-name">${workspace.name}</span>
                <span class="sidebar-workspace-path">${workspace.path}</span>
              </span>
            </button>
          `,
        )
        .join('')}
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
      <div class="hero-title">${t('common.noWorkspaceConnected')}</div>
      <p class="hero-description">${t('common.openProjectFolderToConnect')}</p>
    </div>
    <div class="hero-actions">
      <button data-action="open-workspace" class="button primary">${t('common.openWorkspace')}</button>
      <button data-action="open-workspace-help" class="ghost-link" type="button">${t('common.learnMoreAboutWorkspaces')}</button>
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
          <div class="hero-title">${t('common.workspaceNotInitialized')}</div>
          <p class="hero-description">${t('common.workspaceNotInitializedDescription')}</p>
          <div class="hero-chip">${t('common.configPathLabel')}</div>
          <p class="hero-subtext">${t('common.configFileDoesNotExist')}</p>
          <p class="hero-subtext">${t('common.initInstructions')}</p>
        </div>
        <div class="hero-actions">
          <button data-action="show-init-confirm" class="button primary" ${disabledAttr(state.loading)}>${t('common.initializeWorkspace')}</button>
          <button data-action="open-workspace" class="button secondary" ${disabledAttr(state.loading)}>${t('common.openAnotherWorkspace')}</button>
        </div>
      </section>

      <section class="info-card card">
        <div class="info-card-header">${t('common.initializeWorkspaceInfoTitle')}</div>
        <div class="info-card-body">
          ${formatInitializeWorkspaceInfoBody()}
        </div>
      </section>
    </div>
  `
}

const renderComingSoonSection = (title: string, description: string): string => `
  <section class="card panel coming-soon-card">
    <div class="coming-soon-icon" aria-hidden="true">${icon.sparkles}</div>
    <h2>${title}</h2>
    <p class="muted">${description}</p>
  </section>
`

const renderSettingsSection = (): string => `
  <div class="settings-stack">
    <section class="card panel settings-panel">
      <div class="panel-header">
        <h2>${t('settings.section.general')}</h2>
      </div>

      <div class="settings-list">
        <div class="settings-row">
          <div>
            <div class="settings-title">${t('settings.general.confirm.title')}</div>
            <div class="settings-description">${t('settings.general.confirm.description')}</div>
          </div>
          <button data-action="toggle-setting" data-setting="confirmBeforeSync" class="setting-toggle" type="button" aria-label="${t('settings.general.confirm.title')}">
            <span class="setting-toggle-track${state.confirmBeforeSync ? ' on' : ''}">
              <span class="setting-toggle-thumb${state.confirmBeforeSync ? ' on' : ''}"></span>
            </span>
          </button>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-title">${t('settings.general.backup.title')}</div>
            <div class="settings-description">${t('settings.general.backup.description')}</div>
          </div>
          <button data-action="toggle-setting" data-setting="autoBackupBeforeApply" class="setting-toggle" type="button" aria-label="${t('settings.general.backup.title')}">
            <span class="setting-toggle-track${state.autoBackupBeforeApply ? ' on' : ''}">
              <span class="setting-toggle-thumb${state.autoBackupBeforeApply ? ' on' : ''}"></span>
            </span>
          </button>
        </div>
      </div>
    </section>

    <section class="card panel settings-panel">
      <div class="panel-header">
        <h2>${t('settings.section.appearance')}</h2>
      </div>

      <div class="settings-list">
        <div class="settings-row">
          <div>
            <div class="settings-title">${t('settings.appearance.theme.title')}</div>
            <div class="settings-description">${t('settings.appearance.theme.description')}</div>
          </div>
          <div class="settings-segment settings-segment-theme" role="group" aria-label="${t('settings.appearance.theme.title')}">
            <button data-action="set-theme-mode" data-theme-mode="system" class="settings-segment-button${state.themeMode === 'system' ? ' active' : ''}" type="button">${t('settings.appearance.theme.system')}</button>
            <button data-action="set-theme-mode" data-theme-mode="light" class="settings-segment-button${state.themeMode === 'light' ? ' active' : ''}" type="button">${t('settings.appearance.theme.light')}</button>
            <button data-action="set-theme-mode" data-theme-mode="dark" class="settings-segment-button${state.themeMode === 'dark' ? ' active' : ''}" type="button">${t('settings.appearance.theme.dark')}</button>
          </div>
        </div>

        <div class="settings-row">
          <div>
            <div class="settings-title">${t('settings.language.title')}</div>
            <div class="settings-description">${t('settings.language.description')}</div>
          </div>
          <label class="settings-select" aria-label="${t('settings.language.title')}">
            <select data-action="set-language-select" class="settings-select-control">
              <option value="en" ${state.lang === 'en' ? 'selected' : ''}>${t('settings.language.english')}</option>
              <option value="ko" ${state.lang === 'ko' ? 'selected' : ''}>${t('settings.language.korean')}</option>
            </select>
            <span class="settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
          </label>
        </div>
      </div>
    </section>

    <section class="card panel settings-panel">
      <div class="panel-header">
        <h2>${t('settings.section.workspace')}</h2>
      </div>

      <div class="settings-list">
        <div class="settings-row">
          <div>
            <div class="settings-title">${t('settings.autoOpen.title')}</div>
            <div class="settings-description">${t('settings.autoOpen.description')}</div>
          </div>
          <button data-action="toggle-setting" data-setting="autoOpenLastWorkspace" class="setting-toggle" type="button" aria-label="${t('settings.autoOpen.title')}">
            <span class="setting-toggle-track${state.autoOpenLastWorkspace ? ' on' : ''}">
              <span class="setting-toggle-thumb${state.autoOpenLastWorkspace ? ' on' : ''}"></span>
            </span>
          </button>
        </div>
      </div>
    </section>

    <section class="card panel settings-panel">
      <div class="panel-header">
        <h2>${t('settings.section.about')}</h2>
      </div>

      <div class="settings-list settings-about-list">
        <div class="settings-row">
          <div>
            <div class="settings-title">${t('settings.about.version')}</div>
            <div class="settings-description">v0.1.0</div>
          </div>
          <a class="button secondary settings-link-button settings-link-button-compact" href="https://github.com/fever-max/mcpspace/releases" target="_blank" rel="noreferrer noopener">
            <span class="button-icon">${icon.open}</span>
            <span>${t('settings.about.releaseNotes')}</span>
          </a>
        </div>
      </div>
    </section>
  </div>
`

const renderReadyState = (): string => {
  const status = state.status
  const workspace = state.workspace

  if (!workspace) {
    return ''
  }

  const clients = clientOrder
  const tools = status?.tools ?? []
  const selectedClient = getSelectedClient()
  const selectedClientLabel = selectedClient ? getClientDisplayName(selectedClient) : t('common.selectAiClientToBegin')
  const selectedClientDraft = selectedClient ? getDraftToolsForClient(selectedClient) : []
  const selectedClientPlan = selectedClient ? state.plan : null
  const changeRows = selectedClientPlan?.actions ?? []

  return `
    <div class="workspace-stack">
      ${renderProjectStrip(workspace)}

      <section class="card panel registry-panel">
        <div class="panel-header panel-header-split">
          <div>
            <h2>${t('common.workspaceMcpTools')}</h2>
            <p class="muted">${t('common.manageWorkspaceMcpTools')}</p>
          </div>
          <button data-action="add-mcp" class="button primary toolbar-button" type="button"><span class="button-icon">${icon.sparkles}</span><span>${t('common.addMcp')}</span></button>
        </div>

        <div class="registry-list">
          ${
            tools.length === 0
              ? `<div class="list-empty">${t('common.noMcpToolsRegistered')}</div>`
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
                          <span class="pill pill-neutral">${t('common.registered')}</span>
                          ${
                            tool.clients.length > 0
                              ? `<button type="button" class="assigned-clients-pill" data-action="open-assigned-clients" data-tool="${tool.toolName}" title="${formatAssignedClientsTitle(tool.clients.map((client) => getClientDisplayName(client)))}"><span class="assigned-dot"></span><span>${formatUsedByLabel(tool.clients.length)}</span></button>`
                              : ''
                          }
                          <button data-action="edit-mcp" data-tool="${tool.toolName}" class="button secondary registry-action toolbar-button" type="button" title="${t('common.edit')} MCP tool"><span>${t('common.edit')}</span></button>
                          <button data-action="remove-mcp" data-tool="${tool.toolName}" class="button danger registry-action toolbar-button" type="button" ${disabledAttr(tool.clients.length > 0)} title="${tool.clients.length > 0 ? formatAssignedClientsTitle(tool.clients.map((client) => getClientDisplayName(client))) : t('common.removeMcpToolQuestion')}"><span>${t('common.remove')}</span></button>
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
          <h2>${t('common.aiClients')}</h2>
          <p class="muted">${t('common.selectAiClientToManage')}</p>
        </div>
        <div class="client-list">
          ${
            clients
              .map(
                (client) => `
                  <button
                    type="button"
                    class="client-row client-row-button${selectedClient === client ? ' selected' : ''}"
                    data-action="select-client"
                    data-client="${client}"
                  >
                    <span class="client-row-main">
                      <span class="client-avatar client-avatar-${client}">${getClientAvatarLabel(client)}</span>
                      <span class="client-copy">
                        <span class="client-name">${getClientDisplayName(client)}</span>
                      </span>
                    </span>
                    <span class="client-row-side">
                      <span class="${getClientRowStatusClass(client)}">${getClientRowStatusLabel(client)}</span>
                      <span class="client-chevron" aria-hidden="true">›</span>
                    </span>
                  </button>
                `,
              )
              .join('')
          }
          </div>
          <div class="client-footnote">${selectedClient ? `1 of ${clients.length} selected` : t('common.selectAiClientToBegin')}</div>
        </section>

        <section class="card panel">
          <div class="panel-header panel-header-split">
            <div>
              <h2>${t('common.mcpToolsFor')} ${selectedClientLabel}</h2>
              <p class="muted">${t('common.chooseWhichMcpToolsShouldBeAvailable')} ${selectedClientLabel}.</p>
            </div>
            <div class="selected-client-chip">
              <span class="selected-client-label">${t('common.selectedClient')}</span>
              <span class="pill pill-neutral">${selectedClientLabel}</span>
            </div>
          </div>

          ${
            selectedClient
              ? `
                <div class="tool-list">
                  ${
                    tools.length === 0
                      ? `<div class="list-empty">${t('common.noMcpToolsRegistered')}</div>`
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
              : `<div class="selected-client-empty list-empty">${t('common.selectAiClientToManage')}</div>`
          }
        </section>
      </section>

      <section class="card panel changes-panel">
        <div class="panel-header changes-header">
            <div>
              <h2>${t('common.changesToApply')}</h2>
              <p class="muted">${t('common.reviewChanges')} ${selectedClientLabel}.</p>
            </div>
        </div>

        <div class="changes-list">
          ${
            selectedClient
              ? selectedClientPlan
                ? changeRows.length === 0
                  ? `<div class="changes-empty">${t('common.noChangesToApply')}</div>`
                  : changeRows
                      .map(
                        (action) => {
                          if (action.type === 'create') {
                            return `
                              <div class="change-row change-attach">
                                <span class="change-icon">↑</span>
                                <span>${t('common.attach')} <strong>${action.toolName}</strong> to <strong>${selectedClientLabel}</strong></span>
                                <span class="pill pill-success">${t('common.attach')}</span>
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
                                <span>${t('common.detach')} <strong>${action.toolName}</strong> from <strong>${selectedClientLabel}</strong></span>
                                <span class="pill pill-warning">${t('common.detach')}</span>
                              </div>
                            `
                          }

                          return `
                            <div class="change-row change-noop">
                              <span class="change-icon">•</span>
                                <span>${t('common.noChangeFor')} <strong>${action.toolName}</strong></span>
                              <span class="pill pill-neutral">${t('common.noop')}</span>
                            </div>
                          `
                        },
                      )
                      .join('')
                : `<div class="changes-empty">${t('common.loadingChanges')}</div>`
              : `<div class="changes-empty">${t('common.selectAiClientToReviewChanges')}</div>`
          }
        </div>

        ${selectedClientPlan ? `<div class="changes-summary muted">${selectedClientPlan.summary.create} ${t('common.create')}, ${selectedClientPlan.summary.update} ${t('common.update')}, ${selectedClientPlan.summary.delete} ${t('common.delete')}, ${selectedClientPlan.summary.noop} ${t('common.noop')}</div>` : ''}

        <div class="changes-footer">
          <button data-action="refresh-plan" class="button secondary icon-button" type="button" ${disabledAttr(state.loading || !selectedClient)} aria-label="${t('common.reviewChanges')}" title="${t('common.reviewChanges')}"><span class="button-icon">${icon.search}</span></button>
          <button data-action="sync-client" class="button primary" type="button" ${disabledAttr(state.loading || !selectedClient)}><span class="button-icon">${icon.refresh}</span><span>${t('common.applyChanges')}</span></button>
        </div>
      </section>
      <section class="status-summary">
        <span class="muted">${status?.inSyncCount ?? 0} in sync, ${status?.outOfSyncCount ?? 0} out of sync</span>
      </section>
    </div>
  `
}
const renderWorkspaceBody = (): string => {
  if (state.activeSection === 'marketplace') {
    return renderComingSoonSection(t('common.marketplace'), t('common.marketplaceComingSoon'))
  }

  if (state.activeSection === 'doctor') {
    return renderComingSoonSection(t('common.doctor'), t('common.diagnosticToolsComingSoon'))
  }

  if (state.activeSection === 'settings') {
    return renderSettingsSection()
  }

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
          <h3 id="init-workspace-modal-title">${t('common.initializeWorkspaceQuestion')}</h3>
          <p>${formatInitializeWorkspaceInfoBody()}</p>
          <p>${t('common.initializeWorkspaceInfoFooter')}</p>
        </div>
        <div class="modal-actions">
          <button data-action="cancel-init-workspace" class="button secondary" ${disabledAttr(state.loading)}>${t('sync.confirm.cancel')}</button>
          <button data-action="confirm-init-workspace" class="button primary" ${disabledAttr(state.loading)}>${t('common.initializeWorkspace')}</button>
        </div>
      </section>
    </div>
  `
}

const renderWorkspaceHelpModal = (): string => {
  if (state.workspace || !state.workspaceHelpOpen) {
    return ''
  }

    return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="workspace-help-modal-title">
        <div class="modal-icon" aria-hidden="true">${icon.book}</div>
        <div class="modal-body">
          <h3 id="workspace-help-modal-title">${t('common.learnMoreAboutWorkspacesTitle')}</h3>
          <div class="modal-help-copy">
            <span>${t('common.learnMoreAboutWorkspacesLine1')}</span>
            <span>${t('common.learnMoreAboutWorkspacesLine2')}</span>
            <span>${t('common.learnMoreAboutWorkspacesLine3')}</span>
            <span>${t('common.learnMoreAboutWorkspacesLine4')}</span>
          </div>
        </div>
        <div class="modal-actions">
          <button data-action="close-workspace-help" class="button secondary">${t('common.close')}</button>
        </div>
      </section>
    </div>
  `
}

const renderSyncConfirmModal = (): string => {
  if (!state.syncConfirmOpen || !state.syncConfirmClient) {
    return ''
  }

  const clientLabel = getClientDisplayName(state.syncConfirmClient)

  return `
    <div class="modal-backdrop" role="presentation">
      <section class="modal" role="dialog" aria-modal="true" aria-labelledby="sync-confirm-modal-title">
        <div class="modal-icon modal-icon-danger" aria-hidden="true">${icon.refresh}</div>
        <div class="modal-body">
          <h3 id="sync-confirm-modal-title">${t('sync.confirm.title')}</h3>
          <p>${t('sync.confirm.description')}</p>
          <p><strong>${clientLabel}</strong></p>
        </div>
        <div class="modal-actions">
          <button data-action="cancel-sync-client" class="button secondary" ${disabledAttr(state.loading)}>${t('sync.confirm.cancel')}</button>
          <button data-action="confirm-sync-client" class="button primary" ${disabledAttr(state.loading)}>${t('sync.confirm.apply')}</button>
        </div>
      </section>
    </div>
  `
}


const bindActionHandlers = (): void => {
  document.querySelectorAll<HTMLButtonElement>('[data-action="open-workspace"]').forEach((button) => {
    button.addEventListener('click', async () => {
      state.activeSection = 'workspaces'
      state.workspaceHelpOpen = false
      await openWorkspace()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="open-workspace-help"]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.workspace) {
        return
      }

      state.workspaceHelpOpen = true
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="open-workspace-path"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const workspacePath = button.dataset.path
      if (!workspacePath) {
        return
      }

      await openWorkspacePath(workspacePath)
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

  document.querySelectorAll<HTMLButtonElement>('[data-action="add-mcp"]').forEach((button) => {
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
      const selectedCatalogTools = getSelectedCatalogTools()
      const catalogMode = state.addToolModalTab === 'catalog' && mode === 'add'

      closeAddToolModal()

      if (catalogMode) {
        for (const tool of selectedCatalogTools) {
          await saveTool(tool.toolName, tool.command, tool.args, tool.package, 'add', null)
        }
        return
      }

      await saveTool(toolName, command, args, toolPackage, mode, originalName)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="switch-add-tool-tab"]').forEach((button) => {
    button.addEventListener('click', () => {
      const tab = button.dataset.tab as ViewState['addToolModalTab'] | undefined
      if (!tab || state.addToolModalTab === tab) {
        return
      }

      state.addToolModalTab = tab
      render()
    })
  })

  document.querySelectorAll<HTMLInputElement>('[data-action="catalog-search"]').forEach((input) => {
    input.addEventListener('input', () => {
      state.catalogSearch = input.value
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="select-catalog-tool"]').forEach((button) => {
    button.addEventListener('click', () => {
      const toolName = button.dataset.tool
      if (!toolName) {
        return
      }

      const tool = state.catalogTools.find((item) => item.toolName === toolName)
      if (!tool || tool.isRegistered) {
        return
      }

      toggleCatalogTool(tool)
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

  document.querySelectorAll<HTMLButtonElement>('[data-action="confirm-sync-client"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const client = state.syncConfirmClient
      state.syncConfirmOpen = false
      state.syncConfirmClient = null
      render()
      await syncSelectedClient(client)
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="cancel-sync-client"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.syncConfirmOpen = false
      state.syncConfirmClient = null
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="close-workspace-help"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.workspaceHelpOpen = false
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-theme"]').forEach((button) => {
    button.addEventListener('click', () => {
      const nextThemeMode = state.theme === 'dark' ? 'light' : 'dark'
      applyThemeMode(nextThemeMode)
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="set-theme-mode"]').forEach((button) => {
    button.addEventListener('click', () => {
      const themeMode = button.dataset.themeMode as ViewState['themeMode'] | undefined
      if (!themeMode || state.themeMode === themeMode) {
        return
      }

      applyThemeMode(themeMode)
      render()
    })
  })

  document.querySelectorAll<HTMLSelectElement>('[data-action="set-language-select"]').forEach((select) => {
    select.addEventListener('change', () => {
      const lang = select.value as Lang | undefined
      if (!lang || state.lang === lang) {
        return
      }

      state.lang = lang
      persistSettings()
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-setting"]').forEach((button) => {
    button.addEventListener('click', () => {
      const setting = button.dataset.setting as 'autoOpenLastWorkspace' | 'confirmBeforeSync' | 'autoBackupBeforeApply' | undefined
      if (!setting) {
        return
      }

      state[setting] = !state[setting]
      persistSettings()
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="select-client"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeSection = 'workspaces'
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
      requestSyncSelectedClient()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="refresh-workspace"]').forEach((button) => {
    button.addEventListener('click', () => {
      void refreshWorkspaceView()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="select-section"]').forEach((button) => {
    button.addEventListener('click', () => {
      const section = button.dataset.section as ViewState['activeSection'] | undefined
      if (!section) {
        return
      }

      state.activeSection = section
      render()
    })
  })
}
const render = (): void => {
  const selectedClient = getSelectedClient()
  const badgeLabel = getWorkspaceBadgeLabel(state.workspace, state.status)
  const badgeClass = getWorkspaceBadgeClass(state.workspace, state.status)
  const sectionHeadings: Record<ViewState['activeSection'], { eyebrow: string; title: string; subtitle: string }> = {
    workspaces: {
      eyebrow: t('common.workspace'),
      title: state.workspace ? state.workspace.name : t('common.noWorkspaceConnected'),
      subtitle: state.workspace ? state.workspace.path : t('common.openProjectFolderToConnect'),
    },
    marketplace: {
      eyebrow: '',
      title: t('common.marketplace'),
      subtitle: t('common.marketplaceComingSoon'),
    },
    doctor: {
      eyebrow: '',
      title: t('common.doctor'),
      subtitle: t('common.diagnosticToolsComingSoon'),
    },
    settings: {
      eyebrow: '',
      title: t('common.settingsTitle'),
      subtitle: t('settings.subtitle'),
    },
  }

  const sectionHeading = sectionHeadings[state.activeSection]
  const showWorkspaceBadge = state.activeSection === 'workspaces' && Boolean(badgeLabel)

  document.body.dataset.theme = state.theme

  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><img class="brand-logo" src="${brandLogoUrl}" alt="" aria-hidden="true" /><span>mcpspace</span></div>
        <nav class="nav">
          <button data-action="select-section" data-section="workspaces" class="nav-item${state.activeSection === 'workspaces' ? ' active' : ''}" type="button"><span class="nav-icon">${icon.folder}</span><span>${t('common.workspaces')}</span></button>
          <button data-action="select-section" data-section="marketplace" class="nav-item${state.activeSection === 'marketplace' ? ' active' : ''}" type="button"><span class="nav-icon">${icon.search}</span><span>${t('common.marketplace')}</span></button>
          <button data-action="select-section" data-section="doctor" class="nav-item${state.activeSection === 'doctor' ? ' active' : ''}" type="button"><span class="nav-icon">${icon.warning}</span><span>${t('common.doctor')}</span></button>
          <button data-action="select-section" data-section="settings" class="nav-item${state.activeSection === 'settings' ? ' active' : ''}" type="button"><span class="nav-icon">${icon.dots}</span><span>${t('common.settingsTitle')}</span></button>
        </nav>

        ${renderSidebarWorkspace()}

        <div class="sidebar-footer">
          <button data-action="open-workspace" class="button secondary sidebar-button">${t('common.openWorkspaceFolder')}</button>
          <div class="sidebar-footer-row">
            <div class="theme-toggle-shell" aria-hidden="true">
              <span class="theme-toggle-icon">${state.theme === 'light' ? icon.sun : icon.moon}</span>
              <button data-action="toggle-theme" class="theme-toggle" type="button" aria-label="Toggle theme">
                <span class="theme-toggle-track"><span class="theme-toggle-thumb"></span></span>
              </button>
            </div>
            <div class="sidebar-version">v0.1.0</div>
          </div>
        </div>
      </aside>

      <main class="main">
        <header class="header">
          <div>
            ${sectionHeading.eyebrow ? `<div class="eyebrow">${sectionHeading.eyebrow}</div>` : ''}
            <div class="header-title-row">
              <h1>${sectionHeading.title}</h1>
              ${showWorkspaceBadge ? `<span class="${badgeClass}">${badgeLabel}</span>` : ''}
            </div>
            <p class="subtitle">${sectionHeading.subtitle}</p>
          </div>
          ${
            state.activeSection === 'workspaces'
              ? `
                <div class="header-actions">
                  <button data-action="refresh-workspace" class="button secondary sync-button toolbar-button icon-button" type="button" ${disabledAttr(state.loading)} aria-label="${t('common.refresh')}" title="${t('common.refresh')}"><span class="button-icon">${icon.refresh}</span></button>
                  <button class="button secondary" type="button" aria-label="More options" disabled><span class="button-icon">${icon.dots}</span></button>
                </div>
              `
              : ''
          }
        </header>

        ${state.error ? `<section class="card error-card"><strong>Error:</strong> ${state.error}</section>` : ''}
        ${renderWorkspaceBody()}
      </main>
    </div>
    ${renderInitConfirmModal()}
    ${renderWorkspaceHelpModal()}
    ${renderSyncConfirmModal()}
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
  state.activeSection = 'workspaces'
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
  rememberWorkspace(currentResult.data)

  if (currentResult.data === null && state.autoOpenLastWorkspace) {
    const recentWorkspacePath = readLastWorkspacePath()
    if (recentWorkspacePath) {
      state.loading = false
      render()
      await openWorkspacePath(recentWorkspacePath)
      return
    }
  }

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
  state.activeSection = 'workspaces'
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
  rememberWorkspace(state.workspace)

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

const openWorkspacePath = async (workspacePath: string): Promise<void> => {
  if (!workspacePath) {
    return
  }

  state.loading = true
  state.error = null
  state.initConfirmOpen = false
  state.activeSection = 'workspaces'
  render()

  const result = await window.mcpspace.workspace.openPath(workspacePath)
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
  rememberWorkspace(state.workspace)

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
  state.activeSection = 'workspaces'
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
  rememberWorkspace(state.workspace)
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
