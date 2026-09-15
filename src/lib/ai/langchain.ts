import { ChatGroq } from '@langchain/groq'
import { DEFAULT_MODEL, MODELS, getGroqApiKey } from './groq'

// Create LangChain-compatible Groq chat model
export function createChatModel(options?: {
  model?: string
  temperature?: number
  maxTokens?: number
}) {
  return new ChatGroq({
    apiKey: getGroqApiKey(),
    model: options?.model || DEFAULT_MODEL,
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxTokens ?? 2048,
  })
}

type ModelPreset = 'fast' | 'balanced' | 'reasoning'

const presets: Record<ModelPreset, Parameters<typeof createChatModel>[0]> = {
  // Fast classification and entity extraction
  fast: { model: MODELS.LLAMA_8B, temperature: 0.1, maxTokens: 1024 },
  // Balanced - good for most tasks
  balanced: { model: MODELS.LLAMA_70B, temperature: 0.3, maxTokens: 2048 },
  // Complex reasoning - daily plans, summaries
  reasoning: { model: MODELS.LLAMA_70B, temperature: 0.4, maxTokens: 4096 },
}

const cache = new Map<ModelPreset, ChatGroq>()

/**
 * Pre-configured models, built on first use and cached afterwards.
 * Building them at import time crashed `next build`, which loads every
 * route module before any request has an API key available.
 */
export function getModel(preset: ModelPreset): ChatGroq {
  let model = cache.get(preset)
  if (!model) {
    model = createChatModel(presets[preset])
    cache.set(preset, model)
  }
  return model
}
