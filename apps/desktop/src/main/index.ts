import { app, BrowserWindow, ipcMain } from 'electron'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { registerWorkspaceIpc } from './ipc/workspace.ipc.js'
import { createDesktopServices } from './services/create-desktop-services.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rendererUrl = process.env.ELECTRON_RENDERER_URL ?? process.env.VITE_DEV_SERVER_URL

const createWindow = async (): Promise<any> => {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1200,
    minHeight: 800,
    title: 'mcpspace',
    webPreferences: {
      preload: join(__dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  })

  if (!app.isPackaged && rendererUrl) {
    await window.loadURL(rendererUrl)
    return window
  }

  await window.loadFile(join(__dirname, '../renderer/index.html'))
  return window
}

const start = async (): Promise<void> => {
  const services = createDesktopServices()
  registerWorkspaceIpc(services, ipcMain)

  await app.whenReady()
  await createWindow()

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow()
    }
  })
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

void start()
