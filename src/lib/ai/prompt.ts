// Prompts live in ./prompts/*.md so they can be read, diffed and versioned like any
// other text. Each file has a version line, a "## system" part and a "## user" part,
// with {{variables}} filled in at call time.
import { readFileSync } from 'node:fs'
import path from 'node:path'

export type PromptName = 'organize' | 'daily-plan' | 'weekly-summary' | 'ask' | 'ask-notes'

type PromptFile = { version: string; system: string; user: string }

const cache = new Map<PromptName, PromptFile>()

export function parsePrompt(source: string): PromptFile {
  const match = source.match(/^---\nversion: (\S+)\n---\n+## system\n([\s\S]*?)\n## user\n([\s\S]*)$/)
  if (!match) throw new Error('Prompt file needs a version line, a "## system" part and a "## user" part')
  return { version: match[1], system: match[2].trim(), user: match[3].trim() }
}

function loadPrompt(name: PromptName): PromptFile {
  let prompt = cache.get(name)
  if (!prompt) {
    // next.config.ts traces this folder into the server bundle
    const file = path.join(process.cwd(), 'src/lib/ai/prompts', `${name}.md`)
    prompt = parsePrompt(readFileSync(file, 'utf8'))
    cache.set(name, prompt)
  }
  return prompt
}

/** Fills {{variables}}. A variable the prompt uses but the caller forgot is an error, not a blank. */
export function fill(template: string, variables: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    if (!(key in variables)) throw new Error(`Prompt variable "${key}" was not provided`)
    return String(variables[key])
  })
}

export function renderPrompt(name: PromptName, variables: Record<string, string | number>) {
  const prompt = loadPrompt(name)
  return {
    version: prompt.version,
    system: fill(prompt.system, variables),
    user: fill(prompt.user, variables),
  }
}
