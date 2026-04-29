import { BrowserWindow } from 'electron'
import OpenAI, { toFile } from 'openai'

let client: OpenAI | null = null

function getClient(apiKey: string): OpenAI {
  if (!client || client.apiKey !== apiKey) {
    client = new OpenAI({ apiKey })
  }
  return client
}

export async function streamChat(
  mainWindow: BrowserWindow,
  payload: {
    messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
    model: string;
    systemPrompt: string;
    apiKey: string;
    reasoningEffort: 'off' | 'minimal' | 'low' | 'medium' | 'high';
  }
): Promise<void> {
  const openai = getClient(payload.apiKey)

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

  // Add system prompt
  if (payload.systemPrompt) {
    messages.push({ role: 'system', content: payload.systemPrompt })
  }

  // Add conversation messages
  for (const msg of payload.messages) {
    messages.push(msg as OpenAI.Chat.Completions.ChatCompletionMessageParam)
  }

  try {
    const isReasoningModel = /^(o\d|gpt-5)/.test(payload.model)
    const sendReasoning = isReasoningModel && payload.reasoningEffort !== 'off'

    const stream = await openai.chat.completions.create({
      model: payload.model,
      messages,
      stream: true,
      ...(sendReasoning && { reasoning_effort: payload.reasoningEffort })
    })

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content
      if (delta) {
        mainWindow.webContents.send('openai-stream-chunk', delta)
      }
    }

    mainWindow.webContents.send('openai-stream-done')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    mainWindow.webContents.send('openai-stream-error', message)
  }
}

export async function transcribeAudio(
  audioBuffer: ArrayBuffer,
  apiKey: string
): Promise<string> {
  const openai = getClient(apiKey)

  const buffer = Buffer.from(audioBuffer)
  const file = await toFile(buffer, 'audio.webm', { type: 'audio/webm' })

  const response = await openai.audio.transcriptions.create({
    model: 'whisper-1',
    file,
    language: 'en',
    response_format: 'text'
  })

  return response as unknown as string
}
