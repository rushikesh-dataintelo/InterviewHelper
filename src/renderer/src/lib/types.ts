export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  screenshots: string[] // base64 data URLs
  timestamp: number
}

export interface SystemPrompt {
  id: string
  name: string
  content: string
  isDefault: boolean
}

export type STTProvider = 'whisper'

export type ReasoningEffort = 'off' | 'minimal' | 'low' | 'medium' | 'high'

export function modelSupportsReasoning(model: string): boolean {
  return /^(o\d|gpt-5)/.test(model)
}
