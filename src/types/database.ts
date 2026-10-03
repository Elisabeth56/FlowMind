export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_runs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string | null
          operation: string
          output_tokens: number | null
          prompt_version: string | null
          provider: string | null
          success: boolean
          units: number
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          operation: string
          output_tokens?: number | null
          prompt_version?: string | null
          provider?: string | null
          success?: boolean
          units?: number
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string | null
          operation?: string
          output_tokens?: number | null
          prompt_version?: string | null
          provider?: string | null
          success?: boolean
          units?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_runs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plan_items: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          item_id: string
          plan_id: string
          position: number
          scheduled_time: string | null
          why: string | null
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          item_id: string
          plan_id: string
          position: number
          scheduled_time?: string | null
          why?: string | null
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          item_id?: string
          plan_id?: string
          position?: number
          scheduled_time?: string | null
          why?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_plan_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inbox_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_plan_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "daily_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_plans: {
        Row: {
          completion_notes: string | null
          created_at: string
          energy_recommendation: string | null
          id: string
          plan_date: string
          reasoning: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_notes?: string | null
          created_at?: string
          energy_recommendation?: string | null
          id?: string
          plan_date: string
          reasoning?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_notes?: string | null
          created_at?: string
          energy_recommendation?: string | null
          id?: string
          plan_date?: string
          reasoning?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_items: {
        Row: {
          ai_status: string
          completed_at: string | null
          content: string
          created_at: string
          due_date: string | null
          extracted_entities: NonNullable<Json>
          id: string
          is_actionable: boolean
          item_type: string
          organized_at: string | null
          priority: number
          project_id: string | null
          sentiment: string | null
          status: string
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_status?: string
          completed_at?: string | null
          content: string
          created_at?: string
          due_date?: string | null
          extracted_entities?: NonNullable<Json>
          id?: string
          is_actionable?: boolean
          item_type?: string
          organized_at?: string | null
          priority?: number
          project_id?: string | null
          sentiment?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_status?: string
          completed_at?: string | null
          content?: string
          created_at?: string
          due_date?: string | null
          extracted_entities?: NonNullable<Json>
          id?: string
          is_actionable?: boolean
          item_type?: string
          organized_at?: string | null
          priority?: number
          project_id?: string | null
          sentiment?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "project_counts"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "inbox_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_events: {
        Row: {
          event_key: string
          event_type: string
          id: number
          payload: NonNullable<Json>
          processed_at: string | null
          received_at: string
        }
        Insert: {
          event_key: string
          event_type: string
          id?: number
          payload: NonNullable<Json>
          processed_at?: string | null
          received_at?: string
        }
        Update: {
          event_key?: string
          event_type?: string
          id?: number
          payload?: NonNullable<Json>
          processed_at?: string | null
          received_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          paystack_transaction_id: number | null
          plan_type: string | null
          reference: string
          status: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          paystack_transaction_id?: number | null
          plan_type?: string | null
          reference: string
          status?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          paystack_transaction_id?: number | null
          plan_type?: string | null
          reference?: string
          status?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          daily_plan_time: string
          email: string | null
          full_name: string | null
          id: string
          preferences: NonNullable<Json>
          timezone: string
          updated_at: string
          weekly_summary_day: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          daily_plan_time?: string
          email?: string | null
          full_name?: string | null
          id: string
          preferences?: NonNullable<Json>
          timezone?: string
          updated_at?: string
          weekly_summary_day?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          daily_plan_time?: string
          email?: string | null
          full_name?: string | null
          id?: string
          preferences?: NonNullable<Json>
          timezone?: string
          updated_at?: string
          weekly_summary_day?: number
        }
        Relationships: []
      }
      projects: {
        Row: {
          ai_confidence: number | null
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          status: string
          suggested_by_ai: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          status?: string
          suggested_by_ai?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          status?: string
          suggested_by_ai?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          ended_at: string | null
          next_payment_at: string | null
          paystack_customer_code: string | null
          paystack_subscription_code: string | null
          plan: string | null
          started_at: string | null
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          next_payment_at?: string | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan?: string | null
          started_at?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          next_payment_at?: string | null
          paystack_customer_code?: string | null
          paystack_subscription_code?: string | null
          plan?: string | null
          started_at?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_summaries: {
        Row: {
          accomplishments: NonNullable<Json>
          created_at: string
          id: string
          items_carried_over: number
          items_completed: number
          items_created: number
          keep: string | null
          plan_completion_rate: number | null
          productivity_trend: string | null
          project_counts: NonNullable<Json>
          summary_text: string | null
          try_next: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          accomplishments?: NonNullable<Json>
          created_at?: string
          id?: string
          items_carried_over?: number
          items_completed?: number
          items_created?: number
          keep?: string | null
          plan_completion_rate?: number | null
          productivity_trend?: string | null
          project_counts?: NonNullable<Json>
          summary_text?: string | null
          try_next?: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          accomplishments?: NonNullable<Json>
          created_at?: string
          id?: string
          items_carried_over?: number
          items_completed?: number
          items_created?: number
          keep?: string | null
          plan_completion_rate?: number | null
          productivity_trend?: string | null
          project_counts?: NonNullable<Json>
          summary_text?: string | null
          try_next?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_summaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      project_counts: {
        Row: {
          completed_count: number | null
          item_count: number | null
          project_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      ai_units_this_month: {
        Args: { p_now?: string; p_user_id: string }
        Returns: number
      }
      plan_candidates: {
        Args: { p_limit?: number; p_today: string }
        Returns: {
          content: string
          due_date: string
          id: string
          priority: number
          project_name: string
        }[]
      }
      save_daily_plan: {
        Args: {
          p_energy_recommendation: string
          p_items: Json
          p_plan_date: string
          p_reasoning: string
        }
        Returns: string
      }
      week_days: {
        Args: { p_week_end: string; p_week_start: string }
        Returns: {
          day: string
          done: number
          planned: number
        }[]
      }
      week_stats: {
        Args: { p_week_end: string; p_week_start: string }
        Returns: {
          items_carried_over: number
          items_completed: number
          items_created: number
          plan_steps: number
          plan_steps_done: number
          projects: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
