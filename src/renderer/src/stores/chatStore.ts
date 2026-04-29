import { create } from 'zustand'
import type { Message } from '../lib/types'

interface ChatState {
  messages: Message[]
  pendingScreenshots: string[]
  isStreaming: boolean
  streamingContent: string
  error: string | null

  addUserMessage: (content: string, screenshots: string[]) => void
  startStream: () => void
  appendStreamChunk: (chunk: string) => void
  finalizeStream: () => void
  setStreamError: (error: string) => void
  addScreenshot: (base64: string) => void
  removeScreenshot: (index: number) => void
  clearScreenshots: () => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  pendingScreenshots: [],
  isStreaming: false,
  streamingContent: '',
  error: null,

  addUserMessage: (content, screenshots) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      screenshots,
      timestamp: Date.now()
    }
    set(state => ({ messages: [...state.messages, msg], error: null }))
  },

  startStream: () => {
    set({ isStreaming: true, streamingContent: '', error: null })
  },

  appendStreamChunk: (chunk) => {
    set(state => ({ streamingContent: state.streamingContent + chunk }))
  },

  finalizeStream: () => {
    const { streamingContent } = get()
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: streamingContent,
      screenshots: [],
      timestamp: Date.now()
    }
    set(state => ({
      messages: [...state.messages, msg],
      isStreaming: false,
      streamingContent: ''
    }))
  },

  setStreamError: (error) => {
    set({ isStreaming: false, streamingContent: '', error })
  },

  addScreenshot: (base64) => {
    set(state => ({ pendingScreenshots: [...state.pendingScreenshots, base64] }))
  },

  removeScreenshot: (index) => {
    set(state => ({
      pendingScreenshots: state.pendingScreenshots.filter((_, i) => i !== index)
    }))
  },

  clearScreenshots: () => set({ pendingScreenshots: [] }),

  clearChat: () => set({ messages: [], streamingContent: '', isStreaming: false, error: null })
}))
