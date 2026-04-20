import { ChatGroq } from '@langchain/groq'
import { DEFAULT_MODEL, MODELS } from './groq'

// Create LangChain-compatible Groq chat model
export function createChatModel(options?: {
  model?: string
  temperature?: number
  maxTokens?: number
}) {
  return new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: options?.model || DEFAULT_MODEL,
    temperature: options?.temperature ?? 0.3,
    maxTokens: options?.maxTokens ?? 2048,
  })
}

// Pre-configured models for different tasks
export const models = {
  // Fast classification and entity extraction
  fast: createChatModel({
    model: MODELS.LLAMA_8B,
    temperature: 0.1,
    maxTokens: 1024,
  }),
  
  // Balanced - good for most tasks
  balanced: createChatModel({
    model: MODELS.MIXTRAL_8X7B,
    temperature: 0.3,
    maxTokens: 2048,
  }),
  
  // Complex reasoning - daily plans, summaries
  reasoning: createChatModel({
    model: MODELS.LLAMA_70B,
    temperature: 0.4,
    maxTokens: 4096,
  }),
}
