import './styles/app.css'
import brandLogoUrl from './assets/logo.png?url'
import { getLanguage, initLanguage, setLanguage, t, type Lang } from './i18n.js'

import type {
  ClientId,
  ClientStatusDto,
  McpCatalogEntryDto,
  SyncPlanDto,
  WorkspaceContextDto,
  WorkspaceDoctorDto,
  WorkspaceStatusDto,
} from '../../shared/dtos.js'

type ViewState = {
  activeSection: 'workspaces' | 'marketplace' | 'doctor' | 'settings'
  workspace: WorkspaceContextDto | null
  status: WorkspaceStatusDto | null
  doctor: WorkspaceDoctorDto | null
  plan: SyncPlanDto | null
  loading: boolean
  doctorLoading: boolean
  error: string | null
  workspaceHelpOpen: boolean
  guideOpen: boolean
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
  languageMenuOpen: boolean
  autoOpenLastWorkspace: boolean
  confirmBeforeSync: boolean
  autoBackupBeforeApply: boolean
  syncConfirmOpen: boolean
  syncConfirmClient: ClientId | null
  reviewLoading: boolean
  workspaceMenuOpenPath: string | null
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
  doctor: null,
  plan: null,
  loading: false,
  doctorLoading: false,
  error: null,
  workspaceHelpOpen: false,
  guideOpen: false,
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
  languageMenuOpen: false,
  autoOpenLastWorkspace: initialSettings.autoOpenLastWorkspace,
  confirmBeforeSync: initialSettings.confirmBeforeSync,
  autoBackupBeforeApply: initialSettings.autoBackupBeforeApply,
  syncConfirmOpen: false,
  syncConfirmClient: null,
  reviewLoading: false,
  workspaceMenuOpenPath: null,
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

const formatDateTime = (value: string | null): string => {
  if (!value) {
    return t('doctor.neverSynced')
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(getLanguage() === 'ko' ? 'ko-KR' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

const getDoctorHealthLabel = (status: WorkspaceDoctorDto['overall']['status']): string => {
  if (status === 'healthy') {
    return t('doctor.healthy')
  }

  if (status === 'warning') {
    return t('doctor.warning')
  }

  return t('doctor.error')
}

const getDoctorHealthClass = (status: WorkspaceDoctorDto['overall']['status']): string => {
  if (status === 'healthy') {
    return 'badge success'
  }

  if (status === 'warning') {
    return 'badge warning'
  }

  return 'badge danger'
}

const getDoctorAdapterLabel = (status: WorkspaceDoctorDto['adapters'][number]['status']): string => {
  if (status === 'healthy') {
    return t('doctor.healthy')
  }

  if (status === 'warning') {
    return t('doctor.warning')
  }

  return t('doctor.notDetected')
}

const getDoctorAdapterClass = (status: WorkspaceDoctorDto['adapters'][number]['status']): string => {
  if (status === 'healthy') {
    return 'badge success'
  }

  if (status === 'warning') {
    return 'badge warning'
  }

  return 'badge danger'
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
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.59 13.41a1 1 0 0 1 0-1.41l3-3a3 3 0 1 1 4.24 4.24l-1.65 1.64-1.41-1.41 1.64-1.65a1 1 0 1 0-1.41-1.41l-3 3a1 1 0 0 1-1.41 0Zm2.82-2.82a1 1 0 0 1 0 1.41l-3 3a3 3 0 0 1-4.24-4.24l1.65-1.64 1.41 1.41-1.64 1.65a1 1 0 1 0 1.41 1.41l3-3a1 1 0 0 1 1.41 0Z" fill="currentColor"/></svg>',
  checkCircle: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm4.78-11.72-5.5 5.5a1 1 0 0 1-1.41 0l-2.65-2.65 1.41-1.41 1.94 1.94 4.79-4.79 1.42 1.41Z" fill="currentColor"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 10 10A10.01 10.01 0 0 0 12 2Zm1 10.59 3.3 3.29-1.42 1.42-3.59-3.59A1 1 0 0 1 11 13V7h2Z" fill="currentColor"/></svg>',
  file: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.41l-3.83-3.83A2 2 0 0 0 13.17 4H7Zm6 1.41L17.59 9H14a1 1 0 0 1-1-1V4.41ZM9 13h6v2H9v-2Zm0 4h6v2H9v-2Zm0-8h3v2H9V9Z" fill="currentColor"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5.25 3.44 9.44 8 11 4.56-1.56 8-5.75 8-11V5l-8-3Zm0 17.86c-3.45-1.4-6-4.87-6-8.86V6.38l6-2.25 6 2.25V11c0 3.99-2.55 7.46-6 8.86Zm-1.3-5.15-2.4-2.41-1.42 1.42 3.12 3.12a1 1 0 0 0 1.41 0l5.3-5.3-1.42-1.41-4.59 4.58Z" fill="currentColor"/></svg>',
  sync: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.32 8.06A7 7 0 0 1 19 11h-2a5 5 0 0 0-8.54-3.54L11 10H4V3l2.32 2.32ZM18 14v7l-2.32-2.32A7 7 0 0 1 5 13h2a5 5 0 0 0 8.54 3.54L13 14h5Z" fill="currentColor"/></svg>',
  help: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm-1-5h2v2h-2v-2Zm1.61-9.96a3.5 3.5 0 0 0-3.6 2.3l1.88.67A1.5 1.5 0 1 1 12 10a1 1 0 0 0-1 1v2h2v-1.16a3.5 3.5 0 0 0-.39-6.8Z" fill="currentColor"/></svg>',
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

const clientAvatarIcons: Record<ClientId, string> = {
  'claude-code': '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M17.3041 3.541h-3.6718l6.696 16.918H24Zm-10.6082 0L0 20.459h3.7442l1.3693-3.5527h7.0052l1.3693 3.5528h3.7442L10.5363 3.5409Zm-.3712 10.2232 2.2914-5.9456 2.2914 5.9456Z"/></svg>',
  codex: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/></svg>',
  cursor: '<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M11.503.131 1.891 5.678a.84.84 0 0 0-.42.726v11.188c0 .3.162.575.42.724l9.609 5.55a1 1 0 0 0 .998 0l9.61-5.55a.84.84 0 0 0 .42-.724V6.404a.84.84 0 0 0-.42-.726L12.497.131a1.01 1.01 0 0 0-.996 0"/><path d="M2.657 6.338h18.55c.263 0 .43.287.297.515L12.23 22.918c-.062.107-.229.064-.229-.06V12.335a.59.59 0 0 0-.295-.51l-9.11-5.257c-.109-.063-.064-.23.061-.23"/></svg>',
}

const getClientAvatarLabel = (client: ClientId): string => clientAvatarIcons[client] ?? client.slice(0, 2).toUpperCase()

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

const refreshSelectedClientPlan = async (
  client: ClientId | null = getSelectedClient(),
  options: { clearFirst?: boolean } = {},
): Promise<void> => {
  if (!client || !state.workspace || state.workspace.status !== 'ready') {
    state.plan = null
    render()
    return
  }

  const clearFirst = options.clearFirst ?? true
  const currentPlanRequestId = ++planRequestId
  if (clearFirst) {
    state.plan = null
    render()
  }

  const result = await window.mcpspace.workspace.plan(client)
  if (currentPlanRequestId !== planRequestId) {
    return
  }

  if (!result.ok) {
    state.error = result.error.message
    state.plan = null
    render()
    return
  }

  if (state.selectedClient === client || getSelectedClient() === client) {
    state.plan = result.data
  }

  render()
}

const reviewSelectedClientChanges = async (client: ClientId | null = getSelectedClient()): Promise<void> => {
  if (!client) {
    return
  }

  state.reviewLoading = true
  state.error = null
  render()

  try {
    await refreshSelectedClientPlan(client, { clearFirst: false })
  } finally {
    state.reviewLoading = false
    render()
  }
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
  state.doctor = null
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

const loadDoctor = async (): Promise<void> => {
  if (!state.workspace) {
    state.doctor = null
    state.doctorLoading = false
    render()
    return
  }

  state.doctorLoading = true
  state.error = null
  render()

  const result = await window.mcpspace.workspace.doctor()
  if (!result.ok) {
    state.error = result.error.message
    state.doctor = null
    state.doctorLoading = false
    render()
    return
  }

  state.doctor = result.data
  state.doctorLoading = false
  render()
}

const getClientStatusLabel = (client: ClientStatusDto): string => {
  if (client.statusKind === 'not_configured') {
    return t('common.notConfigured')
  }

  return client.statusKind === 'out_of_sync' ? t('common.outOfSync') : t('common.inSync')
}

const getClientStatusClass = (client: ClientStatusDto): string => {
  if (client.statusKind === 'not_configured') {
    return 'pill pill-neutral'
  }

  return client.statusKind === 'out_of_sync' ? 'pill pill-warning' : 'pill pill-success'
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
): Promise<boolean> => {
  if (!toolName || !command) {
    return false
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
    return false
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
  return true
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
                  <span class="catalog-selection-count">${selectedTools.length}</span>
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
      </section>
    `
  }

  return `
    <section class="sidebar-workspaces">
      <div class="sidebar-workspaces-heading">${t('common.workspaces')}</div>
      ${workspaceItems
        .map(
          (workspace) => `
            <div class="sidebar-workspace-row">
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
              <div class="sidebar-workspace-menu">
                <button
                  class="sidebar-workspace-menu-trigger"
                  type="button"
                  data-action="toggle-workspace-menu"
                  data-path="${workspace.path}"
                  aria-label="More options"
                >${icon.dots}</button>
                ${state.workspaceMenuOpenPath === workspace.path ? `
                  <div class="sidebar-workspace-dropdown">
                    <button class="sidebar-workspace-dropdown-item danger" type="button" data-action="remove-workspace-from-list" data-path="${workspace.path}">${t('common.removeFromList')}</button>
                  </div>
                ` : ''}
              </div>
            </div>
          `,
        )
        .join('')}
    </section>
  `
}

const renderEmptyState = (): string => `
  <section class="hero empty">
    <div class="hero-illustration hero-illustration-empty" aria-hidden="true">
      <div class="hero-folder hero-folder-icon">${icon.folder}</div>
    </div>
    <div class="hero-copy">
      <div class="hero-title">${t('common.noWorkspaceConnected')}</div>
      <p class="hero-description">${t('common.openProjectFolderToConnect')}</p>
    </div>
    <div class="hero-actions">
      <button data-action="open-workspace" class="button primary">${t('common.openWorkspace')}</button>
      <button data-action="open-guide" class="ghost-link" type="button">${t('common.learnMoreAboutWorkspaces')}</button>
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

const renderDoctorSection = (): string => {
  if (!state.workspace) {
    return `
      <section class="card panel coming-soon-card">
        <div class="coming-soon-icon" aria-hidden="true">${icon.warning}</div>
        <h2>${t('doctor.noWorkspaceTitle')}</h2>
        <p class="muted">${t('doctor.noWorkspaceDescription')}</p>
      </section>
    `
  }

  if (!state.doctor) {
    return `
      <section class="card panel coming-soon-card">
        <div class="coming-soon-icon" aria-hidden="true">${icon.warning}</div>
        <h2>${t('common.overallStatus')}</h2>
        <p class="muted">${state.doctorLoading ? t('doctor.runningChecks') : t('doctor.runChecksToDiagnose')}</p>
      </section>
    `
  }

  const doctor = state.doctor
  const workspacePath = state.workspace.path
  const configStatusClass = getDoctorHealthClass(doctor.configCheck.status)
  const validationStatusClass = getDoctorHealthClass(doctor.validationCheck.status)
  const syncStatusClass = getDoctorHealthClass(doctor.syncCheck.status)
  const overallIcon = doctor.overall.status === 'healthy' ? icon.checkCircle : icon.warning
  const syncStatusLabel = doctor.syncCheck.outOfSyncCount > 0
    ? t('common.outOfSync')
    : doctor.syncCheck.status === 'healthy'
      ? t('common.inSync')
      : getDoctorHealthLabel(doctor.syncCheck.status)

  return `
    <div class="doctor-stack">
      <section class="card doctor-overall-card">
        <div class="doctor-overall-status">
          <div class="doctor-overall-icon doctor-overall-icon-${doctor.overall.status}" aria-hidden="true">${overallIcon}</div>
          <div class="doctor-overall-copy">
            <div class="doctor-overall-title">${getDoctorHealthLabel(doctor.overall.status)}</div>
            <p class="muted">${doctor.overall.message}</p>
          </div>
        </div>

        <div class="doctor-overall-metrics">
          <div class="doctor-metric">
            <span class="doctor-metric-label">${t('common.workspaceLabel')}</span>
            <span class="doctor-metric-value">${doctor.overall.workspaceName}</span>
          </div>
          <div class="doctor-metric">
            <span class="doctor-metric-label">${t('common.lastChecked')}</span>
            <span class="doctor-metric-value">${formatDateTime(doctor.overall.lastCheckedAt)}</span>
          </div>
          <div class="doctor-metric">
            <span class="doctor-metric-label">${t('doctor.lastSync')}</span>
            <span class="doctor-metric-value">${formatDateTime(doctor.overall.lastSyncAt)}</span>
          </div>
        </div>

        <button data-action="run-doctor-checks" class="button primary" type="button" ${disabledAttr(state.doctorLoading)}>
          <span>${t('common.runChecks')}</span>
        </button>
      </section>

      <section class="doctor-check-grid">
        <section class="card panel doctor-check-card">
          <div class="panel-header panel-header-split">
            <div class="doctor-check-heading">
              <span class="doctor-check-title-icon" aria-hidden="true">${icon.file}</span>
              <h2>${t('doctor.configFileCheck')}</h2>
            </div>
            <span class="${configStatusClass}">${getDoctorHealthLabel(doctor.configCheck.status)}</span>
          </div>
          <p class="muted">${doctor.configCheck.message}</p>
          <dl class="doctor-detail-list">
            <div><dt>${t('doctor.path')}</dt><dd><code>${doctor.configCheck.path.replace(`${workspacePath}\\`, '')}</code></dd></div>
            <div><dt>${t('doctor.exists')}</dt><dd>${doctor.configCheck.exists ? t('doctor.yes') : t('doctor.no')}</dd></div>
            <div><dt>${t('doctor.readable')}</dt><dd>${doctor.configCheck.readable ? t('doctor.yes') : t('doctor.no')}</dd></div>
            <div><dt>${t('doctor.parse')}</dt><dd>${doctor.configCheck.parseValid ? t('doctor.validYaml') : t('doctor.invalidYaml')}</dd></div>
          </dl>
        </section>

        <section class="card panel doctor-check-card">
          <div class="panel-header panel-header-split">
            <div class="doctor-check-heading">
              <span class="doctor-check-title-icon" aria-hidden="true">${icon.shield}</span>
              <h2>${t('doctor.desiredStateValidation')}</h2>
            </div>
            <span class="${validationStatusClass}">${getDoctorHealthLabel(doctor.validationCheck.status)}</span>
          </div>
          <p class="muted">${doctor.validationCheck.message}</p>
          <dl class="doctor-detail-list">
            <div><dt>${t('doctor.schemaValidation')}</dt><dd>${doctor.validationCheck.valid ? t('doctor.passed') : t('doctor.failed')}</dd></div>
            ${
              doctor.validationCheck.errors.length > 0
                ? `<div><dt>${t('doctor.errors')}</dt><dd>${doctor.validationCheck.errors[0]}</dd></div>`
                : ''
            }
          </dl>
        </section>

        <section class="card panel doctor-check-card">
          <div class="panel-header panel-header-split">
            <div class="doctor-check-heading">
              <span class="doctor-check-title-icon" aria-hidden="true">${icon.sync}</span>
              <h2>${t('doctor.syncStatus')}</h2>
            </div>
            <span class="${syncStatusClass}">${syncStatusLabel}</span>
          </div>
          <p class="muted">${doctor.syncCheck.message}</p>
          <dl class="doctor-detail-list">
            <div><dt>${t('doctor.status')}</dt><dd>${syncStatusLabel}</dd></div>
            <div><dt>${t('doctor.outOfSyncClients')}</dt><dd>${doctor.syncCheck.outOfSyncCount}</dd></div>
            <div><dt>${t('doctor.lastSync')}</dt><dd>${formatDateTime(doctor.syncCheck.lastSyncAt)}</dd></div>
          </dl>
        </section>
      </section>

      <section class="card panel">
        <div class="panel-header">
          <h2>${t('doctor.adapterDetection')}</h2>
          <p class="muted">${t('doctor.adapterDetectionDescription')}</p>
        </div>
        <div class="doctor-adapter-list">
          ${doctor.adapters.map((adapter) => `
            <div class="doctor-adapter-row">
              <div class="doctor-adapter-main">
                <span class="client-avatar client-avatar-${adapter.client}">${getClientAvatarLabel(adapter.client)}</span>
                <div class="doctor-adapter-copy">
                  <div class="doctor-adapter-name">${getClientDisplayName(adapter.client)}</div>
                  <div class="doctor-adapter-path"><code>${adapter.configPath.replace(`${workspacePath}\\`, '')}</code></div>
                </div>
              </div>
              <div class="doctor-adapter-meta">
                <span class="${getDoctorAdapterClass(adapter.status)}">${getDoctorAdapterLabel(adapter.status)}</span>
                <span class="pill pill-neutral">${adapter.toolCount} ${t('doctor.tools')}</span>
                <button data-action="open-adapter-config" data-path="${adapter.configPath}" class="button secondary toolbar-button doctor-adapter-action" type="button" title="${t('doctor.openConfig')}">
                  <span class="button-icon">${icon.open}</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="doctor-bottom-grid">
        <section class="card panel">
          <div class="panel-header panel-header-split">
            <div>
              <h2>${t('doctor.backupSummary')}</h2>
              <p class="muted">${doctor.backupSummary.message}</p>
            </div>
            <button data-action="open-backup-folder" class="button secondary toolbar-button" type="button">
              <span>${t('doctor.viewBackups')}</span>
            </button>
          </div>
          <dl class="doctor-detail-list">
            <div><dt>${t('doctor.lastBackup')}</dt><dd>${formatDateTime(doctor.backupSummary.lastBackupAt)}</dd></div>
            <div><dt>${t('doctor.backupCount')}</dt><dd>${doctor.backupSummary.backupCount}</dd></div>
          </dl>
          <div class="doctor-backup-list">
            ${
              doctor.backupSummary.items.length === 0
                ? `<div class="list-empty">${t('doctor.noBackupsFound')}</div>`
                : doctor.backupSummary.items.map((item) => `
                    <div class="doctor-backup-item">
                      <div class="doctor-backup-name">${item.name}</div>
                      <div class="doctor-backup-time">${formatDateTime(item.createdAt)}</div>
                    </div>
                  `).join('')
            }
          </div>
        </section>

        <section class="card panel">
          <div class="panel-header">
            <h2>${t('doctor.warnings')}</h2>
            <p class="muted">${doctor.warnings.length > 0 ? t('doctor.reviewWarnings') : ''}</p>
          </div>
          <div class="doctor-warning-list">
            ${
              doctor.warnings.length === 0
                ? `<div class="list-empty">${t('doctor.noWarnings')}</div>`
                : doctor.warnings.map((warning) => `
                    <div class="doctor-warning-item">
                      <span class="doctor-warning-dot doctor-warning-dot-${warning.level}" aria-hidden="true"></span>
                      <div class="doctor-warning-copy">
                        <div class="doctor-warning-title">${warning.message}</div>
                        <div class="doctor-warning-source">${warning.source}</div>
                      </div>
                    </div>
                  `).join('')
            }
          </div>
        </section>
      </section>
    </div>
  `
}

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
          <div class="settings-select settings-select-menu" aria-label="${t('settings.language.title')}">
            <button data-action="toggle-language-menu" class="settings-select-control settings-select-trigger" type="button" aria-haspopup="menu" aria-expanded="${state.languageMenuOpen ? 'true' : 'false'}">
              <span class="settings-select-value">${state.lang === 'ko' ? t('settings.language.korean') : t('settings.language.english')}</span>
              <span class="settings-select-chevron" aria-hidden="true">${icon.chevron}</span>
            </button>
            ${state.languageMenuOpen ? `
              <div class="settings-select-panel" role="menu">
                <button data-action="set-language-option" data-lang="en" class="settings-select-option${state.lang === 'en' ? ' active' : ''}" type="button">${t('settings.language.english')}</button>
                <button data-action="set-language-option" data-lang="ko" class="settings-select-option${state.lang === 'ko' ? ' active' : ''}" type="button">${t('settings.language.korean')}</button>
              </div>
            ` : ''}
          </div>
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
              <p class="muted">${t('common.chooseWhichMcpToolsShouldBeAvailable')}</p>
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
          <button data-action="refresh-plan" class="button secondary" type="button" ${disabledAttr(state.loading || !selectedClient)} aria-label="${t('common.reviewChanges')}" title="${t('common.reviewChanges')}"><span class="button-icon">${icon.search}</span><span>${t('common.reviewChanges')}</span></button>
        </div>

        <div class="changes-list-shell${state.reviewLoading ? ' is-loading' : ''}">
          <div class="changes-list${state.reviewLoading ? ' is-dimmed' : ''}">
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

          ${
            state.reviewLoading
              ? `
                <div class="changes-loading-overlay" aria-live="polite" aria-busy="true">
                  <div class="changes-loading-spinner" aria-hidden="true"></div>
                  <div class="changes-loading-label">${t('common.loadingChanges')}</div>
                </div>
              `
              : ''
          }
        </div>

        ${selectedClientPlan ? `<div class="changes-summary muted">${selectedClientPlan.summary.create} ${t('common.create')}, ${selectedClientPlan.summary.update} ${t('common.update')}, ${selectedClientPlan.summary.delete} ${t('common.delete')}, ${selectedClientPlan.summary.noop} ${t('common.noop')}</div>` : ''}

        <div class="changes-footer">
          <button data-action="sync-client" class="button primary" type="button" ${disabledAttr(state.loading || !selectedClient)}><span class="button-icon">${icon.refresh}</span><span>${t('common.applyChanges')}</span></button>
        </div>
      </section>
      <section class="status-summary">
        <span class="muted">${status?.inSyncCount ?? 0} ${t('common.inSync').toLowerCase()}, ${status?.outOfSyncCount ?? 0} ${t('common.outOfSync').toLowerCase()}, ${status?.notConfiguredCount ?? 0} ${t('common.notConfigured').toLowerCase()}</span>
      </section>
    </div>
  `
}
const renderWorkspaceBody = (): string => {
  if (state.activeSection === 'marketplace') {
    return renderComingSoonSection(t('common.marketplace'), t('common.marketplaceComingSoon'))
  }

  if (state.activeSection === 'doctor') {
    return renderDoctorSection()
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

const renderGuideModal = (): string => {
  if (!state.guideOpen) {
    return ''
  }

  const steps = [
    {
      title: t('guide.step1.title'),
      desc: t('guide.step1.desc'),
      preview: `
        <div class="guide-preview guide-preview-field">
          <span class="button-icon">${icon.folder}</span>
          <span class="guide-preview-primary">${t('guide.preview.workspace')}</span>
          <span class="guide-preview-chevron">${icon.chevron}</span>
        </div>
      `,
    },
    {
      title: t('guide.step2.title'),
      desc: t('guide.step2.desc'),
      preview: `
        <div class="guide-preview guide-preview-file">
          <div class="guide-preview-primary">${t('guide.preview.config')}</div>
          <span class="pill pill-success">${t('guide.preview.created')}</span>
        </div>
      `,
    },
    {
      title: t('guide.step3.title'),
      desc: t('guide.step3.desc'),
      preview: `
        <div class="guide-preview guide-preview-tool">
          <div>
            <div class="guide-preview-primary">filesystem</div>
            <div class="guide-preview-meta">File system operations</div>
          </div>
          <span class="guide-preview-plus">+</span>
        </div>
      `,
    },
    {
      title: t('guide.step4.title'),
      desc: t('guide.step4.desc'),
      preview: `
        <div class="guide-preview guide-preview-clients">
          <span class="guide-preview-client-pill">CC</span>
          <span class="guide-preview-client-pill">CX</span>
          <span class="guide-preview-client-pill">CU</span>
          <span class="guide-preview-check">✓</span>
        </div>
      `,
    },
    {
      title: t('guide.step5.title'),
      desc: t('guide.step5.desc'),
      preview: `
        <div class="guide-preview guide-preview-apply">
          <span class="button-icon">${icon.checkCircle}</span>
          <span class="guide-preview-primary">${t('guide.preview.apply')}</span>
        </div>
      `,
    },
  ]

  return `
    <div class="modal-backdrop" role="presentation" data-action="close-guide-backdrop">
      <section class="modal modal-guide" role="dialog" aria-modal="true" aria-labelledby="guide-modal-title">
        <button data-action="close-guide" class="modal-close" type="button" aria-label="${t('common.close')}">×</button>
        <div class="modal-body modal-body-left">
          <div class="guide-header">
            <div class="guide-header-title-row">
              <span class="guide-header-icon" aria-hidden="true">${icon.help}</span>
              <h3 id="guide-modal-title">${t('guide.title')}</h3>
            </div>
            <p class="muted">${t('guide.subtitle')}</p>
          </div>
          <ol class="guide-steps">
            ${steps
              .map(
                (step) => `
                  <li class="guide-step">
                    <div class="guide-step-main">
                      <div class="guide-step-copy">
                        <div class="guide-step-title">${step.title}</div>
                        <div class="guide-step-desc">${step.desc}</div>
                      </div>
                    </div>
                    <div class="guide-step-preview">
                      ${step.preview}
                    </div>
                  </li>
                `,
              )
              .join('')}
          </ol>
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

  document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-workspace-menu"]').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      const path = button.dataset.path
      if (!path) return
      state.workspaceMenuOpenPath = state.workspaceMenuOpenPath === path ? null : path
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="remove-workspace-from-list"]').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      const path = button.dataset.path
      if (!path) return
      const updated = readRecentWorkspaces().filter((w) => w.path !== path)
      writeRecentWorkspaces(updated)
      if (state.workspace?.path === path) {
        state.workspace = null
        state.status = null
        state.doctor = null
        state.plan = null
        state.selectedClient = null
        state.draftAssignments = clearDraftAssignments()
      }
      state.workspaceMenuOpenPath = null
      render()
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

      if (catalogMode) {
        let allSucceeded = true
        for (const tool of selectedCatalogTools) {
          const success = await saveTool(tool.toolName, tool.command, tool.args, tool.package, 'add', null)
          if (!success) {
            allSucceeded = false
            break
          }
        }
        if (allSucceeded) {
          closeAddToolModal()
        }
        return
      }

      const success = await saveTool(toolName, command, args, toolPackage, mode, originalName)
      if (success) {
        closeAddToolModal()
      }
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
      const selStart = input.selectionStart
      const selEnd = input.selectionEnd
      state.catalogSearch = input.value
      render()
      const restored = document.querySelector<HTMLInputElement>('[data-action="catalog-search"]')
      if (restored) {
        restored.focus()
        restored.setSelectionRange(selStart, selEnd)
      }
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

  document.querySelectorAll<HTMLButtonElement>('[data-action="open-guide"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.guideOpen = true
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="close-guide"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.guideOpen = false
      render()
    })
  })

  document.querySelectorAll<HTMLElement>('[data-action="close-guide-backdrop"]').forEach((backdrop) => {
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) {
        state.guideOpen = false
        render()
      }
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

  document.querySelectorAll<HTMLButtonElement>('[data-action="toggle-language-menu"]').forEach((button) => {
    button.addEventListener('click', () => {
      state.languageMenuOpen = !state.languageMenuOpen
      render()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="set-language-option"]').forEach((button) => {
    button.addEventListener('click', () => {
      const lang = button.dataset.lang as Lang | undefined
      if (!lang || state.lang === lang) {
        state.languageMenuOpen = false
        render()
        return
      }

      state.lang = lang
      state.languageMenuOpen = false
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
    button.addEventListener('click', async () => {
      const selectedClient = getSelectedClient()
      void reviewSelectedClientChanges(selectedClient)
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

  document.querySelectorAll<HTMLButtonElement>('[data-action="run-doctor-checks"]').forEach((button) => {
    button.addEventListener('click', () => {
      void loadDoctor()
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="open-backup-folder"]').forEach((button) => {
    button.addEventListener('click', async () => {
      if (!state.doctor) {
        return
      }

      const result = await window.mcpspace.workspace.openInExplorer(state.doctor.backupSummary.backupDir)
      if (!result.ok) {
        state.error = result.error.message
        render()
      }
    })
  })

  document.querySelectorAll<HTMLButtonElement>('[data-action="open-adapter-config"]').forEach((button) => {
    button.addEventListener('click', async () => {
      const path = button.dataset.path
      if (!path) {
        return
      }

      const result = await window.mcpspace.workspace.openInExplorer(path)
      if (!result.ok) {
        state.error = result.error.message
        render()
      }
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

      if (section === 'doctor') {
        void loadDoctor()
      }
    })
  })
}
const render = (): void => {
  const selectedClient = getSelectedClient()
  const badgeLabel = getWorkspaceBadgeLabel(state.workspace, state.status)
  const badgeClass = getWorkspaceBadgeClass(state.workspace, state.status)
  const previousActiveSection = state.activeSection
  const previousMainScrollTop = root.querySelector<HTMLElement>('.main')?.scrollTop ?? 0
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
      subtitle: t('doctor.subtitle'),
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
                  <button data-action="open-guide" class="button secondary sync-button toolbar-button icon-button help-button" type="button" aria-label="${t('guide.help')}" title="${t('guide.help')}"><span class="button-icon">${icon.help}</span></button>
                  <button data-action="refresh-workspace" class="button secondary sync-button toolbar-button icon-button" type="button" ${disabledAttr(state.loading)} aria-label="${t('common.refresh')}" title="${t('common.refresh')}"><span class="button-icon">${icon.refresh}</span></button>
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
      ${renderGuideModal()}
      ${renderSyncConfirmModal()}
      ${renderAddToolModal()}
    ${renderRemoveToolModal()}
    ${renderAssignedClientsModal()}
  `

  bindActionHandlers()

  if (previousActiveSection === state.activeSection && previousMainScrollTop > 0) {
    window.requestAnimationFrame(() => {
      const main = root.querySelector<HTMLElement>('.main')
      if (main) {
        main.scrollTop = previousMainScrollTop
      }
    })
  }
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
  state.doctor = null
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
  state.doctor = null
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
  state.doctor = null
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
  state.doctor = null
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

document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement | null
  let changed = false

  if (state.workspaceMenuOpenPath !== null && !target?.closest('.sidebar-workspace-menu')) {
    state.workspaceMenuOpenPath = null
    changed = true
  }

  if (state.languageMenuOpen && !target?.closest('.settings-select-menu')) {
    state.languageMenuOpen = false
    changed = true
  }

  if (changed) {
    render()
  }
})

void loadWorkspace()
