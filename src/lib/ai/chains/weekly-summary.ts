import { ChatPromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'
import { models } from '../langchain'

// Schema for weekly summary output
const weeklySummarySchema = z.object({
  summary_text: z.string().describe('A friendly 2-3 paragraph summary of the week'),
  accomplishments: z.array(z.string()).describe('Key things completed this week (3-5 items)'),
  patterns: z.array(z.object({
    pattern: z.string().describe('The observed pattern'),
    type: z.enum(['positive', 'neutral', 'negative']).describe('Whether this pattern is good or concerning'),
    evidence: z.string().describe('Brief evidence for this pattern'),
  })).describe('Behavioral patterns noticed (2-4 patterns)'),
  suggestions: z.array(z.object({
    suggestion: z.string().describe('The actionable suggestion'),
    priority: z.enum(['high', 'medium', 'low']),
    effort: z.enum(['quick', 'moderate', 'significant']).describe('Effort required to implement'),
  })).describe('Suggestions for next week (2-4 suggestions)'),
  productivity_trend: z.enum(['improving', 'stable', 'declining']).describe('Overall trend compared to last week'),
  focus_score: z.number().min(0).max(100).describe('Overall focus/productivity score for the week'),
  highlight: z.string().describe('Single most notable achievement or moment'),
  concern: z.string().nullable().describe('Main concern to address, if any'),
  next_week_focus: z.string().describe('Recommended focus area for next week'),
})

export type WeeklySummary = z.infer<typeof weeklySummarySchema>

const weeklySummaryParser = StructuredOutputParser.fromZodSchema(weeklySummarySchema)

const weeklySummaryPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a thoughtful productivity coach providing a weekly retrospective.

Your approach:
1. Be encouraging but honest
2. Look for patterns, not just events
3. Give specific, actionable suggestions
4. Celebrate wins, even small ones
5. Frame challenges as opportunities
6. Keep the tone warm and supportive

Week: {week_start} to {week_end}

{format_instructions}`],
  ['human', `Analyze this week's data and provide a summary:

## Items Created This Week: {items_created}
## Items Completed: {items_completed}
## Items Carried Over (still pending): {items_carried_over}
## Completion Rate: {completion_rate}%

## Completed Items:
{completed_items}

## Pending Items (carried over):
{pending_items}

## Daily Plan Adherence:
{plan_adherence}

## Projects Worked On:
{projects_touched}

## Last Week's Summary (for comparison):
{last_week_summary}

Generate an insightful weekly summary.`],
])

// Format completed items
function formatCompletedItems(items: Array<{
  content: string
  project_name: string | null
  completed_at: string
}>): string {
  if (items.length === 0) return 'None completed this week'
  
  return items.map(item => {
    const project = item.project_name ? `[${item.project_name}]` : ''
    const day = new Date(item.completed_at).toLocaleDateString('en-US', { weekday: 'short' })
    return `- ${item.content} ${project} (${day})`
  }).join('\n')
}

function formatPendingItems(items: Array<{
  content: string
  priority: number
  created_at: string
}>): string {
  if (items.length === 0) return 'All caught up!'
  
  return items.map(item => {
    const priority = ['', '🟢', '🟡', '🔴'][item.priority]
    const age = Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24))
    return `- ${priority} ${item.content} (${age} days old)`
  }).join('\n')
}

export const weeklySummaryChain = RunnableSequence.from([
  {
    week_start: (input: {
      weekStart: string
      weekEnd: string
      itemsCreated: number
      itemsCompleted: number
      itemsCarriedOver: number
      completedItems: Array<{ content: string; project_name: string | null; completed_at: string }>
      pendingItems: Array<{ content: string; priority: number; created_at: string }>
      planAdherence: string
      projectsTouched: string[]
      lastWeekSummary: string | null
    }) => input.weekStart,
    week_end: (input) => input.weekEnd,
    items_created: (input) => input.itemsCreated.toString(),
    items_completed: (input) => input.itemsCompleted.toString(),
    items_carried_over: (input) => input.itemsCarriedOver.toString(),
    completion_rate: (input) => {
      const total = input.itemsCreated + input.itemsCarriedOver
      if (total === 0) return '0'
      return Math.round((input.itemsCompleted / total) * 100).toString()
    },
    completed_items: (input) => formatCompletedItems(input.completedItems),
    pending_items: (input) => formatPendingItems(input.pendingItems),
    plan_adherence: (input) => input.planAdherence || 'No daily plans created this week',
    projects_touched: (input) => input.projectsTouched.length > 0 
      ? input.projectsTouched.join(', ') 
      : 'No specific projects',
    last_week_summary: (input) => input.lastWeekSummary || 'No previous week data available',
    format_instructions: () => weeklySummaryParser.getFormatInstructions(),
  },
  weeklySummaryPrompt,
  models.reasoning,
  weeklySummaryParser,
])

// Generate improvement suggestions based on patterns
const improvementPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a productivity coach. Based on patterns across multiple weeks, suggest one key improvement.
Be specific and actionable. Keep response under 100 words.`],
  ['human', `Recent patterns:
{patterns}

Suggest one focused improvement for the user.`],
])

export const improvementChain = RunnableSequence.from([
  {
    patterns: (input: { patterns: string }) => input.patterns,
  },
  improvementPrompt,
  models.balanced,
  (response) => response.content,
])
