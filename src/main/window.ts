import { BrowserWindow, screen, app } from 'electron'
import { join } from 'path'

export function createStealthWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize

  const win = new BrowserWindow({
    width: 420,
    height: 700,
    minWidth: 320,
    minHeight: 400,
    x: screenWidth - 440,
    y: 20,
    frame: false,
    transparent: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    resizable: true,
    hasShadow: false,
    focusable: true,
    show: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  // Core stealth: exclude from screen capture
  win.setContentProtection(true)

  // Show when ready to avoid flash
  win.once('ready-to-show', () => {
    win.show()
  })

  // Load renderer
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}
