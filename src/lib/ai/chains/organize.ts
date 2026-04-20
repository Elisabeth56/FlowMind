import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'
import { models } from '../langchain'

// Schema for organized item output
const organizedItemSchema = z.object({
  item_type: z.enum(['note', 'task', 'idea', 'reminder', 'link']).describe('The type of item'),
  is_actionable: z.boolean().describe('Whether this requires action'),
  priority: z.number().min(0).max(3).describe('Priority: 0=none, 1=low, 2=medium, 3=high'),
  sentiment: z.enum(['positive', 'neutral', 'negative', 'urgent']).describe('Emotional tone'),
  extracted_entities: z.array(z.object({
    type: z.enum(['person', 'date', 'time', 'place', 'project', 'deadline', 'amount']),
    value: z.string(),
  })).describe('Named entities found in the text'),
  extracted_topics: z.array(z.string()).describe('Main topics/themes (2-4 keywords)'),
  suggested_project: z.string().nullable().describe('Suggested project name if applicable'),
  due_date: z.string().nullable().describe('Extracted due date in YYYY-MM-DD format'),
  summary: z.string().describe('One-line summary of the item'),
})

export type OrganizedItem = z.infer<typeof organizedItemSchema>

// Create the output parser
const organizeParser = StructuredOutputParser.fromZodSchema(organizedItemSchema)

// Create the prompt template
const organizePrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an AI assistant that helps organize personal notes, tasks, and ideas.
Your job is to analyze user input and extract structured information.

Rules:
- Be concise and accurate
- Extract dates relative to today: {today}
- Priority 3 (high) = urgent/deadline soon, Priority 2 = important, Priority 1 = low, Priority 0 = no priority
- Mark as actionable if it requires the user to DO something
- For suggested_project, infer a project name if the item clearly belongs to a category (e.g., "Work", "Health", "Side Project")
- Extract entities like people's names, dates, times, places, money amounts

{format_instructions}`],
  ['human', `Analyze and organize this item:

"{content}"

User's existing projects for context: {existing_projects}`],
])

// Create the chain
export const organizeChain = RunnableSequence.from([
  {
    content: (input: { content: string; existingProjects: string[] }) => input.content,
    existing_projects: (input: { content: string; existingProjects: string[] }) => 
      input.existingProjects.length > 0 
        ? input.existingProjects.join(', ') 
        : 'None yet',
    today: () => new Date().toISOString().split('T')[0],
    format_instructions: () => organizeParser.getFormatInstructions(),
  },
  organizePrompt,
  models.fast,
  organizeParser,
])

// Batch organize multiple items
export async function organizeItems(
  items: { id: string; content: string }[],
  existingProjects: string[]
): Promise<Map<string, OrganizedItem>> {
  const results = new Map<string, OrganizedItem>()
  
  // Process in parallel with concurrency limit
  const batchSize = 5
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const promises = batch.map(async (item) => {
      try {
        const result = await organizeChain.invoke({
          content: item.content,
          existingProjects,
        })
        results.set(item.id, result)
      } catch (error) {
        console.error(`Failed to organize item ${item.id}:`, error)
        // Return a default organization on error
        results.set(item.id, {
          item_type: 'note',
          is_actionable: false,
          priority: 0,
          sentiment: 'neutral',
          extracted_entities: [],
          extracted_topics: [],
          suggested_project: null,
          due_date: null,
          summary: item.content.slice(0, 100),
        })
      }
    })
    await Promise.all(promises)
  }
  
  return results
}
