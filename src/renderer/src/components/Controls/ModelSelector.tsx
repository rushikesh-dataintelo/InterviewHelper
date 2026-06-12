import { useSettingsStore } from '../../stores/settingsStore'
import type { Provider } from '../../lib/types'

const MODELS: Record<Provider, Array<{ id: string; name: string }>> = {
  openai: [
    { id: 'gpt-5.4', name: 'GPT-5.4' },
    { id: 'gpt-5.4-mini', name: 'GPT-5.4 Mini' },
    { id: 'gpt-5.3', name: 'GPT-5.3' },
    { id: 'gpt-5.2', name: 'GPT-5.2' },
    { id: 'gpt-4.1', name: 'GPT-4.1' },
    { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini' },
    { id: 'gpt-4.1-nano', name: 'GPT-4.1 Nano' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'o4-mini', name: 'o4 Mini' },
    { id: 'o3', name: 'o3' },
    { id: 'o3-mini', name: 'o3 Mini' },
    { id: 'o3-pro', name: 'o3 Pro' },
    { id: 'o1', name: 'o1' },
  ],
  groq: [
    { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: 'Llama 4 Scout (Vision)' },
    { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: 'Llama 4 Maverick (Vision)' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
    { id: 'llama3-70b-8192', name: 'Llama 3 70B' },
    { id: 'llama3-8b-8192', name: 'Llama 3 8B' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 70B' },
    { id: 'qwen-qwq-32b', name: 'Qwen QWQ 32B' },
  ]
}

export function ModelSelector() {
  const model = useSettingsStore(s => s.model)
  const setModel = useSettingsStore(s => s.setModel)
  const provider = useSettingsStore(s => s.provider)

  const models = MODELS[provider] || MODELS.openai
  const validModel = models.some(m => m.id === model) ? model : models[0].id

  if (validModel !== model) {
    setModel(validModel)
  }

  return (
    <select
      value={validModel}
      onChange={e => setModel(e.target.value)}
      className="text-xs px-2 py-1.5 rounded-lg cursor-pointer outline-none"
      style={{
        background: 'var(--bg-tertiary)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border)'
      }}
    >
      {models.map(m => (
        <option key={m.id} value={m.id}>{m.name}</option>
      ))}
    </select>
  )
}
