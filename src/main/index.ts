import { app, BrowserWindow } from 'electron'
import { createStealthWindow } from './window'
import { registerIpcHandlers } from './ipc-handlers'
import { registerShortcuts, unregisterShortcuts } from './shortcuts'
import { createTray } from './tray'

let mainWindow: BrowserWindow | null = null

app.whenReady().then(() => {
  // Hide from dock on macOS
  if (process.platform === 'darwin') {
    app.dock.hide()
  }

  mainWindow = createStealthWindow()
  registerIpcHandlers(mainWindow)
  registerShortcuts(mainWindow)
  createTray(mainWindow)
})

app.on('window-all-closed', () => {
  app.quit()
})

app.on('will-quit', () => {
  unregisterShortcuts()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createStealthWindow()
  }
})
