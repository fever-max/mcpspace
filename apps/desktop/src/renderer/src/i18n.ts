export type Lang = 'en' | 'ko'

type I18nKey =
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
    'settings.language.description': 'Switch the UI between English and Korean.',
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
    'sync.confirm.apply': 'Apply Changes',
    'sync.confirm.cancel': 'Cancel',
  },
  ko: {
    'settings.title': '설정',
    'settings.subtitle': '앱 언어와 워크스페이스 동작을 조정합니다.',
    'settings.section.general': '일반',
    'settings.section.appearance': '외관',
    'settings.section.workspace': '워크스페이스',
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
    'settings.language.description': 'UI 언어를 영어와 한국어 사이에서 전환합니다.',
    'settings.language.english': 'English',
    'settings.language.korean': '한국어',
    'settings.autoOpen.title': '시작 시 마지막 워크스페이스 열기',
    'settings.autoOpen.description': '앱 시작 시 가장 최근 워크스페이스를 자동으로 엽니다.',
    'settings.about.version': '버전',
    'settings.about.copyright': '저작권',
    'settings.about.releaseNotes': '릴리스 노트 보기',
    'settings.value.on': '켜짐',
    'settings.value.off': '꺼짐',
    'settings.value.english': 'English',
    'settings.value.korean': '한국어',
    'sync.confirm.title': '변경 사항을 적용할까요?',
    'sync.confirm.description': '선택한 AI 클라이언트를 동기화하여 설정 파일을 갱신합니다.',
    'sync.confirm.apply': '변경 적용',
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
