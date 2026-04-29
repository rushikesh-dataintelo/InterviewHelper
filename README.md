# iViewHelper

> A privacy-focused, stealth AI assistant desktop app for meetings, interviews, and screen-sharing sessions.

iViewHelper floats as an always-on-top, invisible overlay that is excluded from screen captures and screenshots. It pairs speech-to-text, screenshot capture, and OpenAI vision-enabled chat into a single keyboard-driven companion that stays out of sight while you work.

## Features

- **Stealth window** — frameless, transparent, always-on-top, hidden from dock/taskbar, and excluded from screen capture (`setContentProtection` on macOS, `WDA_EXCLUDEFROMCAPTURE` on Windows).
- **Streaming chat** — OpenAI chat completions with vision support. API key lives in the main process and is never exposed to the renderer.
- **Speech-to-text** — dual provider: Web Speech API (default) or OpenAI Whisper as a fallback. Continuous mode with interim transcripts.
- **Screenshot capture** — captures the screen excluding the app's own window. Multiple shots can be attached to a single message and sent as `image_url` blocks.
- **System prompts** — full CRUD with three defaults shipped (General Assistant, Technical Interview Helper, Meeting Notes). Switch active prompt from the control bar.
- **Global keyboard shortcuts** — every action is reachable system-wide, even when the app is unfocused.
- **Adjustable opacity** (10–100%), font size (12/14/16/18px), and 3-stop window snap (left/center/right).
- **Markdown rendering** — GitHub-flavored markdown with syntax-highlighted code blocks.
- **Persistent storage** — settings and prompts saved via `electron-store`.

## Tech Stack

- **Electron 35** with `electron-vite`
- **React 19** + **TypeScript** + **Tailwind CSS 4**
- **Zustand** for state management
- **OpenAI SDK** for chat and Whisper transcription
- **electron-builder** for DMG (macOS, universal) and NSIS (Windows x64) packaging

## Project Layout

```
src/
├── main/           Electron main process
│   ├── index.ts          App entry, lifecycle
│   ├── window.ts         Stealth BrowserWindow setup
│   ├── ipc-handlers.ts   IPC channels
│   ├── openai.ts         Streaming chat + Whisper
│   ├── screenshot.ts     Screen capture (screencapture / desktopCapturer)
│   ├── shortcuts.ts      Global keyboard shortcuts
│   ├── tray.ts           System tray
│   └── store.ts          electron-store persistence
├── preload/        contextBridge IPC API
└── renderer/       React UI
    └── src/
        ├── components/   TitleBar, Chat, Controls, Settings
        ├── hooks/        useSpeechRecognition, useOpenAI, useScreenshot
        ├── stores/       chat, settings, speech (Zustand)
        └── lib/
```

See [`PROMPT.md`](./PROMPT.md) for the full architecture and behavioural spec.

## Getting Started

### Prerequisites

- Node.js 18+
- An OpenAI API key
- **macOS**: Screen Recording permission (System Settings → Privacy & Security → Screen Recording). In dev, grant it to your terminal.

### Install

```bash
npm install
```

### Run in development

```bash
npm run dev
```

The app opens as a floating window in the top-right corner. Open the settings panel (gear icon) to paste your OpenAI API key.

### Type check

```bash
npm run typecheck
```

## Build & Package

```bash
npm run build           # build only
npm run package:mac     # macOS DMG (universal)
npm run package:win     # Windows NSIS installer (x64)
npm run package:all     # both
```

Cross-platform builds require platform-specific runners — you cannot cross-compile.

## Keyboard Shortcuts

All shortcuts work system-wide.

| Shortcut | Action |
| --- | --- |
| `Cmd/Ctrl+Shift+H` | Show / hide window |
| `Cmd/Ctrl+Shift+M` | Toggle microphone |
| `Cmd/Ctrl+Shift+S` | Take screenshot |
| `Cmd/Ctrl+Shift+R` | Clear chat |
| `Cmd/Ctrl+Shift+Backspace` | Clear message input |
| `Cmd/Ctrl+Shift+E` | Focus message input |
| `Cmd/Ctrl+Shift+↑ / ↓` | Scroll chat |
| `Cmd/Ctrl+Shift+← / →` | Snap window left / center / right |
| `Enter` | Send message |
| `Shift+Enter` | New line |

## Configuration

Persistent settings (stored in `electron-store`):

```json
{
  "apiKey": "",
  "model": "gpt-5.4",
  "opacity": 0.95,
  "fontSize": 14,
  "sttProvider": "webspeech",
  "activeSystemPromptId": "default-general",
  "systemPrompts": [],
  "windowBounds": null
}
```

For local development you can also seed an API key with `.env`:

```
OPENAI_API_KEY=sk-...
```

See [`.env.example`](./.env.example).

## Known Limitations

1. **macOS 15+ (Sequoia)** — `setContentProtection` is broken against ScreenCaptureKit-based apps (Zoom desktop, OBS, QuickTime). It still works against browser-based tools (Google Meet, Teams web). Use the opacity slider and `Cmd+Shift+H` as mitigations.
2. **Web Speech API** — may surface "network error" in some Electron configurations. Switch to the Whisper provider in settings as a fallback.
3. **Screenshots on macOS** — require Screen Recording permission. In dev mode, grant it to your terminal application.
4. **Whisper recording cycles** — each cycle stops and restarts the MediaRecorder so the resulting audio file has valid headers. Mid-stream chunks without headers are rejected by the API.

## License

Private / unpublished.
