// App-level names for database rows. `database.ts` is generated (npm run db:types) and
// must not be edited by hand; anything the app adds on top lives here.
import type { Tables, TablesInsert } from './database'

export type { Database, Json } from './database'

export type Profile = Tables<'profiles'>
export type InboxItem = Tables<'inbox_items'>
export type Project = Tables<'projects'>
export type DailyPlan = Tables<'daily_plans'>
export type WeeklySummary = Tables<'weekly_summaries'>
export type PaymentTransaction = Tables<'payment_transactions'>
export type Subscription = Tables<'subscriptions'>
export type AiRun = Tables<'ai_runs'>

export type NewInboxItem = TablesInsert<'inbox_items'>
export type NewProject = TablesInsert<'projects'>
