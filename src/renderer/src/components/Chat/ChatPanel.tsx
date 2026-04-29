import { useEffect } from 'react'
import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { ImagePreview } from './ImagePreview'
import { useChatStore } from '../../stores/chatStore'
import { useSettingsStore } from '../../stores/settingsStore'

export function ChatPanel() {
  const addUserMessage = useChatStore(s => s.addUserMessage)
  const startStream = useChatStore(s => s.startStream)
  const appendStreamChunk = useChatStore(s => s.appendStreamChunk)
  const finalizeStream = useChatStore(s => s.finalizeStream)
  const setStreamError = useChatStore(s => s.setStreamError)
  const messages = useChatStore(s => s.messages)
  const apiKey = useSettingsStore(s => s.apiKey)
  const model = useSettingsStore(s => s.model)
  const reasoningEffort = useSettingsStore(s => s.reasoningEffort)
  const getActivePromptContent = useSettingsStore(s => s.getActivePromptContent)

  // Set up stream listeners
  useEffect(() => {
    const unsubChunk = window.electronAPI.onStreamChunk((chunk) => {
      appendStreamChunk(chunk)
    })
    const unsubDone = window.electronAPI.onStreamDone(() => {
      finalizeStream()
    })
    const unsubError = window.electronAPI.onStreamError((error) => {
      setStreamError(error)
    })

    return () => {
      unsubChunk()
      unsubDone()
      unsubError()
    }
  }, [appendStreamChunk, finalizeStream, setStreamError])

  const handleSend = async (content: string, screenshots: string[]) => {
    // Add user message to chat
    addUserMessage(content, screenshots)

    // Build messages for API
    const apiMessages = [...useChatStore.getState().messages].map(msg => {
      if (msg.role === 'user' && msg.screenshots.length > 0) {
        const contentParts: Array<{ type: string; text?: string; image_url?: { url: string } }> = []
        if (msg.content) {
          contentParts.push({ type: 'text', text: msg.content })
        }
        for (const screenshot of msg.screenshots) {
          contentParts.push({ type: 'image_url', image_url: { url: screenshot } })
        }
        return { role: msg.role, content: contentParts }
      }
      return { role: msg.role, content: msg.content }
    })

    startStream()

    await window.electronAPI.sendChat({
      messages: apiMessages,
      model,
      systemPrompt: getActivePromptContent(),
      apiKey,
      reasoningEffort
    })
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <MessageList />
      <ImagePreview />
      <MessageInput onSend={handleSend} />
    </div>
  )
}
