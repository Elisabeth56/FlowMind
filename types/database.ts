export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          timezone: string
          // Subscription (Paystack)
          subscription_tier: 'free' | 'pro' | 'enterprise'
          subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'non_renewing'
          subscription_plan: 'pro_monthly' | 'pro_yearly' | null
          subscription_started_at: string | null
          subscription_ended_at: string | null
          subscription_next_payment: string | null
          // Paystack integration
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          // Usage
          ai_calls_this_month: number
          ai_calls_reset_at: string
          // Preferences
          daily_plan_time: string
          weekly_summary_day: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'non_renewing'
          subscription_plan?: 'pro_monthly' | 'pro_yearly' | null
          subscription_started_at?: string | null
          subscription_ended_at?: string | null
          subscription_next_payment?: string | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          ai_calls_this_month?: number
          ai_calls_reset_at?: string
          daily_plan_time?: string
          weekly_summary_day?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          timezone?: string
          subscription_tier?: 'free' | 'pro' | 'enterprise'
          subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing' | 'non_renewing'
          subscription_plan?: 'pro_monthly' | 'pro_yearly' | null
          subscription_started_at?: string | null
          subscription_ended_at?: string | null
          subscription_next_payment?: string | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          ai_calls_this_month?: number
          ai_calls_reset_at?: string
          daily_plan_time?: string
          weekly_summary_day?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inbox_items: {
        Row: {
          id: string
          user_id: string
          content: string
          item_type: 'note' | 'task' | 'idea' | 'reminder' | 'link'
          extracted_entities: Json
          extracted_topics: Json
          sentiment: 'positive' | 'neutral' | 'negative' | 'urgent' | null
          project_id: string | null
          priority: number
          due_date: string | null
          status: 'inbox' | 'organized' | 'in_progress' | 'completed' | 'archived'
          is_actionable: boolean
          created_at: string
          updated_at: string
          organized_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          content: string
          item_type?: 'note' | 'task' | 'idea' | 'reminder' | 'link'
          extracted_entities?: Json
          extracted_topics?: Json
          sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent' | null
          project_id?: string | null
          priority?: number
          due_date?: string | null
          status?: 'inbox' | 'organized' | 'in_progress' | 'completed' | 'archived'
          is_actionable?: boolean
          created_at?: string
          updated_at?: string
          organized_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          content?: string
          item_type?: 'note' | 'task' | 'idea' | 'reminder' | 'link'
          extracted_entities?: Json
          extracted_topics?: Json
          sentiment?: 'positive' | 'neutral' | 'negative' | 'urgent' | null
          project_id?: string | null
          priority?: number
          due_date?: string | null
          status?: 'inbox' | 'organized' | 'in_progress' | 'completed' | 'archived'
          is_actionable?: boolean
          created_at?: string
          updated_at?: string
          organized_at?: string | null
          completed_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          color: string
          icon: string
          suggested_by_ai: boolean
          ai_confidence: number | null
          status: 'active' | 'paused' | 'completed' | 'archived'
          item_count: number
          completed_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          suggested_by_ai?: boolean
          ai_confidence?: number | null
          status?: 'active' | 'paused' | 'completed' | 'archived'
          item_count?: number
          completed_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          suggested_by_ai?: boolean
          ai_confidence?: number | null
          status?: 'active' | 'paused' | 'completed' | 'archived'
          item_count?: number
          completed_count?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      daily_plans: {
        Row: {
          id: string
          user_id: string
          plan_date: string
          reasoning: string | null
          energy_recommendation: string | null
          plan_items: Json
          items_completed: number
          items_total: number
          completion_notes: string | null
          status: 'active' | 'completed' | 'skipped'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_date: string
          reasoning?: string | null
          energy_recommendation?: string | null
          plan_items?: Json
          items_completed?: number
          items_total?: number
          completion_notes?: string | null
          status?: 'active' | 'completed' | 'skipped'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_date?: string
          reasoning?: string | null
          energy_recommendation?: string | null
          plan_items?: Json
          items_completed?: number
          items_total?: number
          completion_notes?: string | null
          status?: 'active' | 'completed' | 'skipped'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      weekly_summaries: {
        Row: {
          id: string
          user_id: string
          week_start: string
          week_end: string
          items_created: number
          items_completed: number
          items_carried_over: number
          summary_text: string | null
          accomplishments: Json
          patterns: Json
          suggestions: Json
          productivity_trend: 'improving' | 'stable' | 'declining' | null
          focus_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          week_start: string
          week_end: string
          items_created?: number
          items_completed?: number
          items_carried_over?: number
          summary_text?: string | null
          accomplishments?: Json
          patterns?: Json
          suggestions?: Json
          productivity_trend?: 'improving' | 'stable' | 'declining' | null
          focus_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          week_start?: string
          week_end?: string
          items_created?: number
          items_completed?: number
          items_carried_over?: number
          summary_text?: string | null
          accomplishments?: Json
          patterns?: Json
          suggestions?: Json
          productivity_trend?: 'improving' | 'stable' | 'declining' | null
          focus_score?: number | null
          created_at?: string
        }
        Relationships: []
      }
      ai_processing_log: {
        Row: {
          id: string
          user_id: string
          operation_type: 'organize' | 'daily_plan' | 'weekly_summary' | 'extract_entities'
          input_tokens: number | null
          output_tokens: number | null
          model_used: string | null
          latency_ms: number | null
          success: boolean
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          operation_type: 'organize' | 'daily_plan' | 'weekly_summary' | 'extract_entities'
          input_tokens?: number | null
          output_tokens?: number | null
          model_used?: string | null
          latency_ms?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          operation_type?: 'organize' | 'daily_plan' | 'weekly_summary' | 'extract_entities'
          input_tokens?: number | null
          output_tokens?: number | null
          model_used?: string | null
          latency_ms?: number | null
          success?: boolean
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          id: string
          user_id: string
          reference: string
          paystack_transaction_id: number | null
          amount: number
          plan_type: 'pro_monthly' | 'pro_yearly' | null
          status: 'pending' | 'success' | 'failed' | 'abandoned'
          created_at: string
          verified_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          reference: string
          paystack_transaction_id?: number | null
          amount: number
          plan_type?: 'pro_monthly' | 'pro_yearly' | null
          status?: 'pending' | 'success' | 'failed' | 'abandoned'
          created_at?: string
          verified_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          reference?: string
          paystack_transaction_id?: number | null
          amount?: number
          plan_type?: 'pro_monthly' | 'pro_yearly' | null
          status?: 'pending' | 'success' | 'failed' | 'abandoned'
          created_at?: string
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Profile = Database['public']['Tables']['profiles']['Row']
export type InboxItem = Database['public']['Tables']['inbox_items']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type DailyPlan = Database['public']['Tables']['daily_plans']['Row']
export type WeeklySummary = Database['public']['Tables']['weekly_summaries']['Row']
export type PaymentTransaction = Database['public']['Tables']['payment_transactions']['Row']

export type NewInboxItem = Database['public']['Tables']['inbox_items']['Insert']
export type NewProject = Database['public']['Tables']['projects']['Insert']
export type NewPaymentTransaction = Database['public']['Tables']['payment_transactions']['Insert']
