// Add these types to your existing types/database.ts file
// Or replace the profiles type with this updated version

export type Profile = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  timezone: string
  
  // Subscription
  subscription_tier: 'free' | 'pro' | 'enterprise'
  subscription_status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'non_renewing'
  subscription_plan: 'pro_monthly' | 'pro_yearly' | null
  subscription_started_at: string | null
  subscription_ended_at: string | null
  subscription_next_payment: string | null
  
  // Paystack
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

export type PaymentTransaction = {
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

// Update your Database type to include the new table
export type DatabaseTables = {
  profiles: {
    Row: Profile
    Insert: Partial<Profile> & { id: string }
    Update: Partial<Profile>
  }
  payment_transactions: {
    Row: PaymentTransaction
    Insert: Omit<PaymentTransaction, 'id' | 'created_at'> & { id?: string; created_at?: string }
    Update: Partial<PaymentTransaction>
  }
  // ... other tables
}
