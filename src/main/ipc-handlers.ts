import { ipcMain, BrowserWindow } from 'electron'
import { captureScreen } from './screenshot'
import { streamChat, transcribeAudio } from './openai'
import { store, getSystemPrompts, saveSystemPrompt, deleteSystemPrompt } from './store'

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Window controls
  ipcMain.on('window-minimize', () => {
    mainWindow.hide()
  })

  ipcMain.on('window-close', () => {
    mainWindow.close()
  })

  ipcMain.on('set-opacity', (_event, opacity: number) => {
    mainWindow.setOpacity(Math.max(0.1, Math.min(1, opacity)))
  })

  ipcMain.on('set-always-on-top', (_event, value: boolean) => {
    mainWindow.setAlwaysOnTop(value)
  })

  // Screenshot
  ipcMain.handle('capture-screenshot', async () => {
    return captureScreen(mainWindow)
  })

  // OpenAI chat
  ipcMain.handle('openai-chat', async (_event, payload: {
    messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
    model: string;
    systemPrompt: string;
    apiKey: string;
    reasoningEffort: 'off' | 'minimal' | 'low' | 'medium' | 'high';
  }) => {
    return streamChat(mainWindow, payload)
  })

  // OpenAI Whisper STT
  ipcMain.handle('whisper-transcribe', async (_event, payload: {
    audioBuffer: ArrayBuffer;
    apiKey: string;
  }) => {
    return transcribeAudio(payload.audioBuffer, payload.apiKey)
  })

  // Settings
  ipcMain.handle('get-settings', () => {
    return {
      apiKey: store.get('apiKey', ''),
      model: store.get('model', 'gpt-5.4'),
      opacity: store.get('opacity', 0.95),
      fontSize: store.get('fontSize', 14),
      sttProvider: store.get('sttProvider', 'whisper'),
      reasoningEffort: store.get('reasoningEffort', 'medium'),
      activeSystemPromptId: store.get('activeSystemPromptId', null)
    }
  })

  ipcMain.on('save-settings', (_event, settings: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(settings)) {
      store.set(key, value)
    }
  })

  // System prompts
  ipcMain.handle('get-system-prompts', () => {
    return getSystemPrompts()
  })

  ipcMain.handle('save-system-prompt', (_event, prompt: {
    id?: string;
    name: string;
    content: string;
  }) => {
    return saveSystemPrompt(prompt)
  })

  ipcMain.handle('delete-system-prompt', (_event, id: string) => {
    return deleteSystemPrompt(id)
  })
}
