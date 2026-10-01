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
      daily_plans: {
        Row: {
          completion_notes: string | null
          created_at: string | null
          energy_recommendation: string | null
          id: string
          items_completed: number | null
          items_total: number | null
          plan_date: string
          plan_items: Json | null
          reasoning: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completion_notes?: string | null
          created_at?: string | null
          energy_recommendation?: string | null
          id?: string
          items_completed?: number | null
          items_total?: number | null
          plan_date: string
          plan_items?: Json | null
          reasoning?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completion_notes?: string | null
          created_at?: string | null
          energy_recommendation?: string | null
          id?: string
          items_completed?: number | null
          items_total?: number | null
          plan_date?: string
          plan_items?: Json | null
          reasoning?: string | null
          status?: string | null
          updated_at?: string | null
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
          completed_at: string | null
          content: string
          created_at: string | null
          due_date: string | null
          extracted_entities: Json | null
          extracted_topics: Json | null
          id: string
          is_actionable: boolean | null
          item_type: string | null
          organized_at: string | null
          priority: number | null
          project_id: string | null
          sentiment: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          content: string
          created_at?: string | null
          due_date?: string | null
          extracted_entities?: Json | null
          extracted_topics?: Json | null
          id?: string
          is_actionable?: boolean | null
          item_type?: string | null
          organized_at?: string | null
          priority?: number | null
          project_id?: string | null
          sentiment?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          content?: string
          created_at?: string | null
          due_date?: string | null
          extracted_entities?: Json | null
          extracted_topics?: Json | null
          id?: string
          is_actionable?: boolean | null
          item_type?: string | null
          organized_at?: string | null
          priority?: number | null
          project_id?: string | null
          sentiment?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
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
          payload: Json
          processed_at: string | null
          received_at: string
        }
        Insert: {
          event_key: string
          event_type: string
          id?: number
          payload: Json
          processed_at?: string | null
          received_at?: string
        }
        Update: {
          event_key?: string
          event_type?: string
          id?: number
          payload?: Json
          processed_at?: string | null
          received_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          paystack_transaction_id: number | null
          plan_type: string | null
          reference: string
          status: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          paystack_transaction_id?: number | null
          plan_type?: string | null
          reference: string
          status?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          paystack_transaction_id?: number | null
          plan_type?: string | null
          reference?: string
          status?: string | null
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
          created_at: string | null
          daily_plan_time: string | null
          email: string | null
          full_name: string | null
          id: string
          timezone: string | null
          updated_at: string | null
          weekly_summary_day: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          daily_plan_time?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          timezone?: string | null
          updated_at?: string | null
          weekly_summary_day?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          daily_plan_time?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string | null
          weekly_summary_day?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          ai_confidence: number | null
          color: string | null
          completed_count: number | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          item_count: number | null
          name: string
          status: string | null
          suggested_by_ai: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          color?: string | null
          completed_count?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          item_count?: number | null
          name: string
          status?: string | null
          suggested_by_ai?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          color?: string | null
          completed_count?: number | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          item_count?: number | null
          name?: string
          status?: string | null
          suggested_by_ai?: boolean | null
          updated_at?: string | null
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
          accomplishments: Json | null
          created_at: string | null
          focus_score: number | null
          id: string
          items_carried_over: number | null
          items_completed: number | null
          items_created: number | null
          patterns: Json | null
          productivity_trend: string | null
          suggestions: Json | null
          summary_text: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          accomplishments?: Json | null
          created_at?: string | null
          focus_score?: number | null
          id?: string
          items_carried_over?: number | null
          items_completed?: number | null
          items_created?: number | null
          patterns?: Json | null
          productivity_trend?: string | null
          suggestions?: Json | null
          summary_text?: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          accomplishments?: Json | null
          created_at?: string | null
          focus_score?: number | null
          id?: string
          items_carried_over?: number | null
          items_completed?: number | null
          items_created?: number | null
          patterns?: Json | null
          productivity_trend?: string | null
          suggestions?: Json | null
          summary_text?: string | null
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
      [_ in never]: never
    }
    Functions: {
      ai_units_this_month: {
        Args: { p_now?: string; p_user_id: string }
        Returns: number
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
