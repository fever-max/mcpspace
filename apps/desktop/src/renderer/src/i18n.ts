export type Lang = 'en' | 'ko'

type I18nKey =
  | 'common.workspace'
  | 'common.noWorkspaceConnected'
  | 'common.openProjectFolderToConnect'
  | 'common.openWorkspace'
  | 'common.learnMoreAboutWorkspaces'
  | 'common.learnMoreAboutWorkspacesTitle'
  | 'common.learnMoreAboutWorkspacesLine1'
  | 'common.learnMoreAboutWorkspacesLine2'
  | 'common.learnMoreAboutWorkspacesLine3'
  | 'common.learnMoreAboutWorkspacesLine4'
  | 'common.noWorkspaceSelected'
  | 'common.openAnotherWorkspace'
  | 'common.workspaceNotInitialized'
  | 'common.workspaceNotInitializedDescription'
  | 'common.configPathLabel'
  | 'common.configFileDoesNotExist'
  | 'common.initInstructions'
  | 'common.initializeWorkspace'
  | 'common.projectPath'
  | 'common.copy'
  | 'common.openInExplorer'
  | 'common.refresh'
  | 'common.addCustomTool'
  | 'common.addMcp'
  | 'common.toolName'
  | 'common.command'
  | 'common.args'
  | 'common.package'
  | 'common.loadingChanges'
  | 'common.initializeWorkspaceQuestion'
  | 'common.initializeWorkspaceInfoTitle'
  | 'common.initializeWorkspaceInfoBody'
  | 'common.addMcpMode'
  | 'common.fromCatalog'
  | 'common.manualInput'
  | 'common.searchMcp'
  | 'common.addSelected'
  | 'common.chooseCatalogMcpToPrefill'
  | 'common.noCatalogMatches'
  | 'common.catalogLoading'
  | 'common.catalogAlreadyRegistered'
  | 'common.selectedCatalogMcp'
  | 'common.selectedCatalogMcps'
  | 'common.addMcpDescription'
  | 'common.editMcpTool'
  | 'common.removeMcpToolQuestion'
  | 'common.removeMcpToolDescription'
  | 'common.close'
  | 'common.removeFromList'
  | 'common.workspaceMcpTools'
  | 'common.manageWorkspaceMcpTools'
  | 'common.noMcpToolsRegistered'
  | 'common.aiClients'
  | 'common.selectAiClientToManage'
  | 'common.noClientStatusYet'
  | 'common.selectAiClientToBegin'
  | 'common.mcpToolsFor'
  | 'common.chooseWhichMcpToolsShouldBeAvailable'
  | 'common.selectedClient'
  | 'common.changesToApply'
  | 'common.reviewChanges'
  | 'common.applyChanges'
  | 'common.selectAiClientToReviewChanges'
  | 'common.noChangeFor'
  | 'common.noChangesToApply'
  | 'common.attach'
  | 'common.detach'
  | 'common.registered'
  | 'common.usedBy'
  | 'common.noAisUsingTool'
  | 'common.edit'
  | 'common.remove'
  | 'common.copyPath'
  | 'common.noWorkspaceSelected'
  | 'common.noWorkspaceSelectedDescription'
  | 'common.openWorkspaceFolder'
  | 'common.overallStatus'
  | 'common.runChecks'
  | 'common.lastChecked'
  | 'common.workspaceLabel'
  | 'common.noWorkspacesYet'
  | 'common.inSync'
  | 'common.outOfSync'
  | 'common.notConfigured'
  | 'common.ready'
  | 'common.notInitialized'
  | 'common.create'
  | 'common.update'
  | 'common.delete'
  | 'common.noop'
  | 'common.settings'
  | 'common.marketplace'
  | 'common.doctor'
  | 'common.diagnosticToolsComingSoon'
  | 'common.marketplaceComingSoon'
  | 'common.workspaces'
  | 'common.settingsTitle'
  | 'settings.title'
  | 'settings.subtitle'
  | 'settings.section.general'
  | 'settings.section.appearance'
  | 'settings.section.workspace'
  | 'settings.section.about'
  | 'settings.general.confirm.title'
  | 'settings.general.confirm.description'
  | 'settings.general.backup.title'
  | 'settings.general.backup.description'
  | 'settings.appearance.theme.title'
  | 'settings.appearance.theme.description'
  | 'settings.appearance.theme.system'
  | 'settings.appearance.theme.light'
  | 'settings.appearance.theme.dark'
  | 'settings.language.title'
  | 'settings.language.description'
  | 'settings.language.english'
  | 'settings.language.korean'
  | 'settings.autoOpen.title'
  | 'settings.autoOpen.description'
  | 'settings.about.version'
  | 'settings.about.copyright'
  | 'settings.about.releaseNotes'
  | 'settings.value.on'
  | 'settings.value.off'
  | 'settings.value.english'
  | 'settings.value.korean'
  | 'sync.confirm.title'
  | 'sync.confirm.description'
  | 'sync.confirm.apply'
  | 'sync.confirm.cancel'

const STORAGE_KEY = 'mcpspace.lang'

const messages: Record<Lang, Record<I18nKey, string>> = {
  en: {
    'common.workspace': 'Workspace',
    'common.noWorkspaceConnected': 'No workspace connected',
    'common.openProjectFolderToConnect': 'Open a project folder to connect a workspace and start managing MCP tools for your AI clients.',
    'common.openWorkspace': 'Open Workspace',
    'common.learnMoreAboutWorkspaces': 'Learn more about workspaces',
    'common.learnMoreAboutWorkspacesTitle': 'What is a workspace?',
    'common.learnMoreAboutWorkspacesLine1': 'A workspace is the project folder for mcpspace.',
    'common.learnMoreAboutWorkspacesLine2': 'mcpspace stores .mcpspace/config.yaml in that folder and reads it back later.',
    'common.learnMoreAboutWorkspacesLine3': 'You can add MCP tools there and connect them to AI clients.',
    'common.learnMoreAboutWorkspacesLine4': 'Open a project folder first, then get started.',
    'common.openWorkspaceFolder': 'Open Workspace Folder',
    'common.noWorkspaceSelected': 'No workspace selected',
    'common.noWorkspaceSelectedDescription': 'Open a workspace to begin.',
    'common.openAnotherWorkspace': 'Open Another Workspace',
    'common.workspaceNotInitialized': 'Workspace not initialized',
    'common.workspaceNotInitializedDescription': 'This workspace has been opened, but it has not been initialized yet.',
    'common.configPathLabel': '.mcpspace/config.yaml',
    'common.configFileDoesNotExist': 'The configuration file .mcpspace/config.yaml does not exist in this workspace.',
    'common.initInstructions': 'Initialize the workspace to set up MCP tools, AI clients, and other project-specific configurations.',
    'common.initializeWorkspace': 'Initialize',
    'common.projectPath': 'Project Path',
    'common.copy': 'Copy',
    'common.openInExplorer': 'Open in Explorer',
    'common.refresh': 'Refresh',
    'common.addCustomTool': 'Add Custom Tool',
    'common.addMcp': 'Add MCP',
    'common.toolName': 'Tool name',
    'common.command': 'Command',
    'common.args': 'Args',
    'common.package': 'Package',
    'common.loadingChanges': 'Loading changes...',
    'common.initializeWorkspaceQuestion': 'Initialize workspace?',
    'common.initializeWorkspaceInfoTitle': 'What happens when you initialize?',
    'common.initializeWorkspaceInfoBody': 'mcpspace will create a .mcpspace folder in this workspace and generate a config.yaml file with default settings. You can customize the configuration after initialization.',
    'common.addMcpMode': 'Add MCP mode',
    'common.fromCatalog': 'Catalog',
    'common.manualInput': 'Manual',
    'common.searchMcp': 'Search MCPs',
    'common.addSelected': 'Add',
    'common.chooseCatalogMcpToPrefill': 'Choose a catalog MCP to prefill command and args.',
    'common.noCatalogMatches': 'No catalog MCPs match your search.',
    'common.catalogLoading': 'Loading catalog MCPs...',
    'common.catalogAlreadyRegistered': 'Already registered in this workspace.',
    'common.selectedCatalogMcp': 'Selected MCP',
    'common.selectedCatalogMcps': 'Selected MCPs',
    'common.addMcpDescription': 'Create a workspace-level MCP tool entry before assigning it to AI clients.',
    'common.editMcpTool': 'Edit MCP tool',
    'common.removeMcpToolQuestion': 'Remove MCP tool?',
    'common.removeMcpToolDescription': 'This will remove the tool from the workspace registry and it will no longer be available for AI client assignment.',
    'common.close': 'Close',
    'common.removeFromList': 'Remove from list',
    'common.workspaceMcpTools': 'Workspace MCP Tools',
    'common.manageWorkspaceMcpTools': 'Manage the MCP tools registered in this workspace.',
    'common.noMcpToolsRegistered': 'No MCP tools registered.',
    'common.aiClients': 'AI Clients',
    'common.selectAiClientToManage': 'Select an AI client to manage its MCP tools.',
    'common.noClientStatusYet': 'No client status yet.',
    'common.selectAiClientToBegin': 'Select an AI client to begin.',
    'common.mcpToolsFor': 'MCP Tools for',
    'common.chooseWhichMcpToolsShouldBeAvailable': 'Choose which MCP tools should be available to',
    'common.selectedClient': 'Selected Client',
    'common.changesToApply': 'Changes to Apply',
    'common.reviewChanges': 'Review Changes',
    'common.applyChanges': 'Apply Changes',
    'common.selectAiClientToReviewChanges': 'Select an AI client to review changes.',
    'common.noChangeFor': 'No change for',
    'common.noChangesToApply': 'No changes to apply.',
    'common.attach': 'Attach',
    'common.detach': 'Detach',
    'common.registered': 'Registered',
    'common.usedBy': 'Used by',
    'common.noAisUsingTool': 'No AI clients are using this tool.',
    'common.edit': 'Edit',
    'common.remove': 'Remove',
    'common.copyPath': 'Copy path',
    'common.overallStatus': 'Overall Status',
    'common.runChecks': 'Run Checks',
    'common.lastChecked': 'Last Checked',
    'common.workspaceLabel': 'Workspace',
    'common.noWorkspacesYet': 'No workspaces yet',
    'common.inSync': 'In sync',
    'common.outOfSync': 'Out of sync',
    'common.notConfigured': 'Not Configured',
    'common.ready': 'Ready',
    'common.notInitialized': 'Not Initialized',
    'common.create': 'create',
    'common.update': 'update',
    'common.delete': 'delete',
    'common.noop': 'no change',
    'common.settings': 'Settings',
    'common.marketplace': 'Marketplace',
    'common.doctor': 'Doctor',
    'common.diagnosticToolsComingSoon': 'Diagnostic tools are coming soon.',
    'common.marketplaceComingSoon': 'Marketplace is coming soon.',
    'common.workspaces': 'Workspaces',
    'common.settingsTitle': 'Settings',
    'settings.title': 'Settings',
    'settings.subtitle': 'Customize the app language and workspace behavior.',
    'settings.section.general': 'General',
    'settings.section.appearance': 'Appearance',
    'settings.section.workspace': 'Workspace',
    'settings.section.about': 'About',
    'settings.general.confirm.title': 'Confirm before syncing changes',
    'settings.general.confirm.description': 'Show a confirmation dialog before applying changes.',
    'settings.general.backup.title': 'Auto backup before applying changes',
    'settings.general.backup.description': 'Create a timestamped backup before changes are applied.',
    'settings.appearance.theme.title': 'Theme',
    'settings.appearance.theme.description': 'Choose how mcpspace looks.',
    'settings.appearance.theme.system': 'System',
    'settings.appearance.theme.light': 'Light',
    'settings.appearance.theme.dark': 'Dark',
    'settings.language.title': 'Language',
    'settings.language.description': 'Switch the UI language',
    'settings.language.english': 'English',
    'settings.language.korean': '한국어',
    'settings.autoOpen.title': 'Open last workspace on startup',
    'settings.autoOpen.description': 'Automatically open the most recent workspace when the app starts.',
    'settings.about.version': 'Version',
    'settings.about.copyright': 'Copyright',
    'settings.about.releaseNotes': 'View Release Notes',
    'settings.value.on': 'On',
    'settings.value.off': 'Off',
    'settings.value.english': 'English',
    'settings.value.korean': '한국어',
    'sync.confirm.title': 'Apply changes?',
    'sync.confirm.description': 'This will sync the selected AI client and update its config file.',
    'sync.confirm.apply': 'Apply',
    'sync.confirm.cancel': 'Cancel',
  },
  ko: {
    'common.workspace': '작업 폴더',
    'common.noWorkspaceConnected': '연결된 작업 폴더가 없습니다',
    'common.openProjectFolderToConnect': '프로젝트 폴더를 열어 작업 폴더를 연결하고 AI 클라이언트를 위한 MCP 도구 관리를 시작합니다.',
    'common.openWorkspace': '작업 폴더 열기',
    'common.learnMoreAboutWorkspaces': '작업 폴더 자세히 보기',
    'common.learnMoreAboutWorkspacesTitle': '작업 폴더란 무엇인가요?',
    'common.learnMoreAboutWorkspacesLine1': '작업 폴더는 mcpspace가 사용하는 프로젝트 폴더입니다.',
    'common.learnMoreAboutWorkspacesLine2': '이 폴더 안에 .mcpspace/config.yaml이 저장되고 다시 읽힙니다.',
    'common.learnMoreAboutWorkspacesLine3': '여기에 MCP 도구를 추가하고 AI 클라이언트에 연결할 수 있습니다.',
    'common.learnMoreAboutWorkspacesLine4': '먼저 작업 폴더를 연 다음 시작하세요.',
    'common.openWorkspaceFolder': '작업 폴더 폴더 열기',
    'common.noWorkspaceSelected': '선택된 작업 폴더 없음',
    'common.noWorkspaceSelectedDescription': '작업 폴더를 열어 시작하세요.',
    'common.openAnotherWorkspace': '다른 작업 폴더 열기',
    'common.workspaceNotInitialized': '작업 폴더가 초기화되지 않았습니다',
    'common.workspaceNotInitializedDescription': '해당 작업 폴더는 열려 있지만 아직 초기화되지 않았습니다.',
    'common.configPathLabel': '.mcpspace/config.yaml',
    'common.configFileDoesNotExist': '해당 작업 폴더에 .mcpspace/config.yaml 설정 파일이 없습니다.',
    'common.initInstructions': '작업 폴더를 초기화하면 MCP 도구, AI 클라이언트, 기타 프로젝트별 설정을 준비합니다.',
    'common.initializeWorkspace': '초기화',
    'common.projectPath': '프로젝트 경로',
    'common.copy': '복사',
    'common.openInExplorer': '탐색기에서 열기',
    'common.refresh': '새로고침',
    'common.addCustomTool': '사용자 MCP 추가',
    'common.addMcp': 'MCP 추가',
    'common.toolName': '도구 이름',
    'common.command': '명령어',
    'common.args': '인수',
    'common.package': '패키지',
    'common.loadingChanges': '변경 사항을 불러오는 중...',
    'common.initializeWorkspaceQuestion': '작업 폴더를 초기화할까요?',
    'common.initializeWorkspaceInfoTitle': '초기화하면 어떻게 되나요?',
    'common.initializeWorkspaceInfoBody': 'mcpspace는 이 작업 폴더에 .mcpspace 폴더를 만들고 기본 설정이 들어간 config.yaml 파일을 생성합니다. 초기화 후 설정을 수정할 수 있습니다.',
    'common.addMcpMode': 'MCP 추가 모드',
    'common.fromCatalog': '카탈로그',
    'common.manualInput': '수동 등록',
    'common.searchMcp': 'MCP 검색',
    'common.addSelected': '추가',
    'common.chooseCatalogMcpToPrefill': '카탈로그의 MCP를 선택하면 command와 args가 자동 입력됩니다.',
    'common.noCatalogMatches': '검색 결과와 일치하는 카탈로그 MCP가 없습니다.',
    'common.catalogLoading': '카탈로그 MCP를 불러오는 중입니다...',
    'common.catalogAlreadyRegistered': '이 작업 폴더에 이미 등록됨',
    'common.selectedCatalogMcp': '선택된 MCP',
    'common.selectedCatalogMcps': '선택된 MCP들',
    'common.addMcpDescription': 'AI 클라이언트에 연결할 MCP 도구 항목을 작업 폴더에 등록합니다.',
    'common.editMcpTool': 'MCP 도구 수정',
    'common.removeMcpToolQuestion': 'MCP 도구를 제거할까요?',
    'common.removeMcpToolDescription': '이 도구를 작업 폴더의 레지스트리에서 제거합니다. 이후 AI 클라이언트에 할당할 수 없습니다.',
    'common.close': '닫기',
    'common.removeFromList': '목록에서 제거',
    'common.workspaceMcpTools': 'MCP 도구',
    'common.manageWorkspaceMcpTools': '해당 작업 폴더에 등록된 MCP 도구를 관리합니다.',
    'common.noMcpToolsRegistered': '등록된 MCP 도구가 없습니다.',
    'common.aiClients': 'AI 클라이언트',
    'common.selectAiClientToManage': 'AI 클라이언트를 선택해 MCP 도구를 관리합니다.',
    'common.noClientStatusYet': '아직 클라이언트 상태가 없습니다.',
    'common.selectAiClientToBegin': '시작할 AI 클라이언트를 선택하세요.',
    'common.mcpToolsFor': '',
    'common.chooseWhichMcpToolsShouldBeAvailable': '어떤 MCP 도구를 사용할지 선택합니다.',
    'common.selectedClient': '선택된 클라이언트',
    'common.changesToApply': '적용할 변경 사항',
    'common.reviewChanges': '변경 내용 검토',
    'common.applyChanges': '변경 적용',
    'common.selectAiClientToReviewChanges': '변경 사항을 검토할 AI 클라이언트를 선택하세요.',
    'common.noChangeFor': '변경 없음',
    'common.noChangesToApply': '적용할 변경 사항이 없습니다.',
    'common.attach': '연결',
    'common.detach': '해제',
    'common.registered': '등록됨',
    'common.usedBy': '사용 중',
    'common.noAisUsingTool': '이 도구를 사용하는 AI 클라이언트가 없습니다.',
    'common.edit': '수정',
    'common.remove': '삭제',
    'common.copyPath': '경로 복사',
    'common.overallStatus': '전체 상태',
    'common.runChecks': '검사 실행',
    'common.lastChecked': '마지막 확인',
    'common.workspaceLabel': '작업 폴더',
    'common.noWorkspacesYet': '아직 작업 폴더가 없습니다',
    'common.inSync': '동기화됨',
    'common.outOfSync': '동기화 안 됨',
    'common.notConfigured': '설정 안 됨',
    'common.ready': '준비됨',
    'common.notInitialized': '초기화 안 됨',
    'common.create': '추가',
    'common.update': '수정',
    'common.delete': '삭제',
    'common.noop': '변경 없음',
    'common.settings': '설정',
    'common.marketplace': '마켓플레이스',
    'common.doctor': '진단',
    'common.diagnosticToolsComingSoon': '진단 도구는 곧 제공됩니다.',
    'common.marketplaceComingSoon': '마켓플레이스는 곧 제공됩니다.',
    'common.workspaces': '작업 폴더',
    'common.settingsTitle': '설정',
    'settings.title': '설정',
    'settings.subtitle': '앱 언어와 작업 폴더 동작을 조정합니다.',
    'settings.section.general': '일반',
    'settings.section.appearance': '외관',
    'settings.section.workspace': '작업 폴더',
    'settings.section.about': '정보',
    'settings.general.confirm.title': '변경 사항 동기화 전 확인',
    'settings.general.confirm.description': '변경 사항을 적용하기 전에 확인 다이얼로그를 표시합니다.',
    'settings.general.backup.title': '변경 적용 전 자동 백업',
    'settings.general.backup.description': '변경 사항을 적용하기 전에 타임스탬프 백업을 생성합니다.',
    'settings.appearance.theme.title': '테마',
    'settings.appearance.theme.description': 'mcpspace의 외관을 선택합니다.',
    'settings.appearance.theme.system': 'System',
    'settings.appearance.theme.light': 'Light',
    'settings.appearance.theme.dark': 'Dark',
    'settings.language.title': '언어',
    'settings.language.description': 'UI 언어를 전환합니다.',
    'settings.language.english': 'English',
    'settings.language.korean': '한국어',
    'settings.autoOpen.title': '시작 시 마지막 작업 폴더 열기',
    'settings.autoOpen.description': '앱 시작 시 가장 최근 작업 폴더를 자동으로 엽니다.',
    'settings.about.version': '버전',
    'settings.about.copyright': '저작권',
    'settings.about.releaseNotes': '릴리스 노트 보기',
    'settings.value.on': '켜짐',
    'settings.value.off': '꺼짐',
    'settings.value.english': 'English',
    'settings.value.korean': '한국어',
    'sync.confirm.title': '변경 사항을 적용할까요?',
    'sync.confirm.description': '선택한 AI 클라이언트를 동기화하여 설정 파일을 갱신합니다.',
    'sync.confirm.apply': '적용',
    'sync.confirm.cancel': '취소',
  },
}

let currentLang: Lang = 'en'

export const initLanguage = (): Lang => {
  const stored = localStorage.getItem(STORAGE_KEY)
  currentLang = stored === 'ko' ? 'ko' : 'en'
  return currentLang
}

export const setLanguage = (lang: Lang): void => {
  currentLang = lang
  localStorage.setItem(STORAGE_KEY, lang)
}

export const getLanguage = (): Lang => currentLang

export const t = (key: I18nKey): string => messages[currentLang][key] ?? messages.en[key] ?? key
