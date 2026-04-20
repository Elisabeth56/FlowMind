import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'
import { models } from '../langchain'

// Schema for daily plan output
const dailyPlanSchema = z.object({
  reasoning: z.string().describe('Brief explanation of why this plan makes sense (2-3 sentences)'),
  energy_recommendation: z.string().describe('Advice on when to tackle different types of work based on typical energy levels'),
  focus_theme: z.string().describe('One phrase describing the main focus for today'),
  plan_items: z.array(z.object({
    item_id: z.string().describe('The ID of the inbox item'),
    scheduled_time: z.string().describe('Suggested time slot (e.g., "09:00", "14:30")'),
    duration_minutes: z.number().describe('Estimated duration in minutes'),
    notes: z.string().describe('Quick tip or context for this task'),
    why_now: z.string().describe('Brief reason why this is scheduled at this time'),
  })).describe('Ordered list of items for today'),
  defer_items: z.array(z.object({
    item_id: z.string(),
    reason: z.string().describe('Why this should be deferred'),
  })).describe('Items that should wait for another day'),
  quick_wins: z.array(z.string()).describe('2-3 small tasks that can be done in spare moments'),
  warnings: z.array(z.string()).describe('Any concerns or conflicts to be aware of'),
})

export type DailyPlan = z.infer<typeof dailyPlanSchema>

const dailyPlanParser = StructuredOutputParser.fromZodSchema(dailyPlanSchema)

const dailyPlanPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an expert productivity coach creating a personalized daily plan.

Your approach:
1. Prioritize high-impact tasks for peak energy hours (usually morning)
2. Group similar tasks together to minimize context switching
3. Leave buffer time between tasks (don't overschedule)
4. Consider deadlines and urgency
5. Balance deep work with lighter tasks
6. Be realistic - most people can only do 4-6 hours of focused work

Today is {today} ({day_of_week}).
Current time: {current_time}

{format_instructions}`],
  ['human', `Create a daily plan based on these inputs:

## User's Pending Items:
{items}

## Today's Context:
- User's timezone: {timezone}
- User's preferred start time: {preferred_start}
- Already completed today: {completed_today}

## User's Projects:
{projects}

Generate a realistic, actionable daily plan.`],
])

// Format items for the prompt
function formatItems(items: Array<{
  id: string
  content: string
  priority: number
  due_date: string | null
  project_name: string | null
  is_actionable: boolean
}>): string {
  if (items.length === 0) return 'No pending items'
  
  return items.map(item => {
    const priority = ['none', 'low', 'medium', 'HIGH'][item.priority]
    const due = item.due_date ? `(due: ${item.due_date})` : ''
    const project = item.project_name ? `[${item.project_name}]` : ''
    const actionable = item.is_actionable ? '⚡' : ''
    return `- [${item.id}] ${actionable} ${item.content} | Priority: ${priority} ${due} ${project}`
  }).join('\n')
}

export const dailyPlanChain = RunnableSequence.from([
  {
    items: (input: {
      items: Array<{
        id: string
        content: string
        priority: number
        due_date: string | null
        project_name: string | null
        is_actionable: boolean
      }>
      projects: string[]
      timezone: string
      preferredStart: string
      completedToday: number
    }) => formatItems(input.items),
    projects: (input) => input.projects.length > 0 ? input.projects.join(', ') : 'No projects yet',
    timezone: (input) => input.timezone,
    preferred_start: (input) => input.preferredStart,
    completed_today: (input) => input.completedToday.toString(),
    today: () => new Date().toISOString().split('T')[0],
    day_of_week: () => new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    current_time: () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    format_instructions: () => dailyPlanParser.getFormatInstructions(),
  },
  dailyPlanPrompt,
  models.reasoning,
  dailyPlanParser,
])

// Simple question answering about the plan
const questionPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a helpful productivity assistant. Answer questions about the user's day and tasks.
Be concise and actionable. Today is {today}.`],
  ['human', `User's current plan:
{plan_summary}

User's question: {question}`],
])

export const answerQuestionChain = RunnableSequence.from([
  {
    plan_summary: (input: { planSummary: string; question: string }) => input.planSummary,
    question: (input) => input.question,
    today: () => new Date().toISOString().split('T')[0],
  },
  questionPrompt,
  models.balanced,
  (response) => response.content,
])
