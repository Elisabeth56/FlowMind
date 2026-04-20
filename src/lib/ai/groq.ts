import Groq from 'groq-sdk'

// Initialize Groq client
export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})

// Available Mistral models on Groq
export const MODELS = {
  // Fast and efficient for simple tasks
  MIXTRAL_8X7B: 'mixtral-8x7b-32768',
  // Larger context, better reasoning
  LLAMA_70B: 'llama-3.1-70b-versatile',
  // Fastest, good for simple classification
  LLAMA_8B: 'llama-3.1-8b-instant',
} as const

// Default model for FlowMind
export const DEFAULT_MODEL = MODELS.MIXTRAL_8X7B

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
