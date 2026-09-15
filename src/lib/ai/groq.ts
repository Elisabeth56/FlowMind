import Groq from 'groq-sdk'

// Models currently served by Groq. `mixtral-8x7b-32768` and
// `llama-3.1-70b-versatile` used to live here but have both been
// decommissioned, so every request against them failed.
export const MODELS = {
  // Fastest, good for classification and entity extraction
  LLAMA_8B: 'llama-3.1-8b-instant',
  // Balanced default
  LLAMA_70B: 'llama-3.3-70b-versatile',
} as const

// Default model for FlowMind
export const DEFAULT_MODEL = MODELS.LLAMA_70B

export function getGroqApiKey(): string {
  const key = process.env.GROQ_API_KEY
  if (!key) {
    throw new Error(
      'GROQ_API_KEY is not set. Add it to your environment to enable AI features.'
    )
  }
  return key
}

// Instantiated on first use, not at import time: the SDK throws when the key
// is missing, which broke `next build` for every route that imports a chain.
let groqClient: Groq | null = null

export function getGroq(): Groq {
  if (!groqClient) {
    groqClient = new Groq({ apiKey: getGroqApiKey() })
  }
  return groqClient
}

// Rate limiting helper
export class RateLimiter {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per second

  constructor(maxTokens = 10, refillRate = 1) {
    this.tokens = maxTokens
    this.maxTokens = maxTokens
    this.refillRate = refillRate
    this.lastRefill = Date.now()
  }

  async acquire(): Promise<void> {
    this.refill()
    
    if (this.tokens < 1) {
      const waitTime = (1 - this.tokens) / this.refillRate * 1000
      await new Promise(resolve => setTimeout(resolve, waitTime))
      this.refill()
    }
    
    this.tokens -= 1
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = (now - this.lastRefill) / 1000
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate)
    this.lastRefill = now
  }
}

export const rateLimiter = new RateLimiter(30, 1) // 30 requests, 1 per second refill
