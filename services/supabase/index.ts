/**
 * Figure AI - Supabase Client Configuration
 * Server-side credit management system
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable auth for this use case - we use RevenueCat for user identification
    persistSession: false,
    autoRefreshToken: false
  }
})

// Database types (for TypeScript)
export interface DbUser {
  id: string
  revenuecat_customer_id: string
  apple_id?: string
  current_credits: number
  subscription_type: 'free' | 'weekly' | 'monthly'
  subscription_status: 'free' | 'active' | 'expired'
  last_credit_reset?: string
  subscription_start_date?: string
  created_at: string
  updated_at: string
}

export interface DbCreditTransaction {
  id: string
  user_id: string
  transaction_type: 'subscription_grant' | 'spend' | 'weekly_reset' | 'subscription_change'
  amount: number
  remaining_credits: number
  reason?: string
  created_at: string
}