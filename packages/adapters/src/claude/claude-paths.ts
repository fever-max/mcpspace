import { selectPath } from '../shared/path-detection.js'

export type ClaudePaths = {
  configPath: string
  detected: boolean
}

export const resolveClaudePaths = (
  env: NodeJS.ProcessEnv = process.env,
): ClaudePaths => {
  const appData = env.APPDATA ?? ''
  const home = env.HOME ?? ''
  const userProfile = env.USERPROFILE ?? ''

  const candidates = [
    appData ? `${appData}\\Claude\\claude_desktop_config.json` : '',
    home ? `${home}/Library/Application Support/Claude/claude_desktop_config.json` : '',
    home ? `${home}/.config/Claude/claude_desktop_config.json` : '',
    userProfile ? `${userProfile}\\AppData\\Roaming\\Claude\\claude_desktop_config.json` : '',
  ]

  const selected = selectPath(candidates)
  return {
    configPath: selected.selectedPath,
    detected: selected.detected,
  }
}
