/**
 * Figure AI - Server-Side Credit Management Service
 * Handles all credit operations through Supabase Edge Functions
 */

import { supabase } from '../supabase'

export interface CreditResponse {
  credits: number
  subscription_status: 'free' | 'active' | 'expired'
  subscription_type: 'free' | 'weekly' | 'monthly'
  period_end?: string | null
  pending_change?: PendingChange | null
}

export interface SpendCreditsResponse {
  success: boolean
  remaining_credits: number
  error?: string
}

export interface CreditResetResponse {
  reset_performed: boolean
  credits: number
  next_reset?: string
  subscription_type?: string
}

export interface PendingChange {
  from: string
  to: string
  effective_date: string
  reason: string
}

export class CreditService {
  /**
   * Get user's current credit balance from server
   */
  static async getCredits(revenueCatCustomerId: string): Promise<CreditResponse> {
    console.log('🔥 CreditService.getCredits called with ID:', revenueCatCustomerId);
    
    try {
      console.log('📡 Calling Supabase credit-operations function...');
      
      const { data, error } = await supabase.functions.invoke('credit-operations', {
        body: { 
          revenuecat_customer_id: revenueCatCustomerId,
          action: 'get-credits'
        }
      })
      
      console.log('📥 Supabase response:', { data, error });

      if (error) {
        console.error('❌ Get credits error:', error)
        throw new Error(error.message || 'Failed to fetch credits')
      }

      const response = {
        credits: data?.credits || 0,
        subscription_status: data?.subscription_status || 'free',
        subscription_type: data?.subscription_type || 'free',
        period_end: data?.period_end || null,
        pending_change: data?.pending_change || null
      };
      
      console.log('✅ CreditService returning:', response);
      return response;
    } catch (error: any) {
      console.error('❌ CreditService.getCredits error:', error)
      // Return default values for offline/error scenarios
      const fallback = {
        credits: 0,
        subscription_status: 'free' as const,
        subscription_type: 'free' as const,
        period_end: null,
        pending_change: null
      };
      console.log('⚠️  Returning fallback:', fallback);
      return fallback;
    }
  }

  /**
   * Spend credits on server (for AI generation)
   */
  static async spendCredits(
    revenueCatCustomerId: string, 
    amount: number,
    reason: string = 'AI generation'
  ): Promise<SpendCreditsResponse> {
    console.log(`💰 Spending ${amount} credits for ${revenueCatCustomerId}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('credit-operations', {
        body: { 
          revenuecat_customer_id: revenueCatCustomerId, 
          amount,
          reason,
          action: 'spend-credits'
        }
      })

      if (error) {
        console.error('❌ Spend credits error:', error)
        return {
          success: false,
          remaining_credits: 0,
          error: error.message || 'Failed to spend credits'
        }
      }

      const result = {
        success: data?.success || false,
        remaining_credits: data?.remaining_credits || 0,
        error: data?.error || undefined
      };
      
      console.log('✅ Spend credits result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ CreditService.spendCredits error:', error)
      return {
        success: false,
        remaining_credits: 0,
        error: error.message || 'Network error'
      }
    }
  }

  /**
   * Check and perform credit reset if needed
   */
  static async checkCreditReset(revenueCatCustomerId: string): Promise<CreditResetResponse> {
    console.log('🔄 Checking credit reset for:', revenueCatCustomerId);
    
    try {
      const { data, error } = await supabase.functions.invoke('credit-operations', {
        body: { 
          revenuecat_customer_id: revenueCatCustomerId,
          action: 'check-reset'
        }
      })

      if (error) {
        console.error('❌ Credit reset check error:', error)
        return { 
          reset_performed: false, 
          credits: 0 
        }
      }

      const result = {
        reset_performed: data?.reset_performed || false,
        credits: data?.credits || 0,
        next_reset: data?.next_reset || undefined,
        subscription_type: data?.subscription_type || undefined
      };
      
      console.log('✅ Credit reset check result:', result);
      return result;
    } catch (error: any) {
      console.error('❌ CreditService.checkCreditReset error:', error)
      return { 
        reset_performed: false, 
        credits: 0 
      }
    }
  }

  /**
   * Register user on server (called after first subscription)
   */
  static async registerUser(revenueCatCustomerId: string): Promise<boolean> {
    try {
      // This will be handled automatically by RevenueCat webhook
      // But we can also manually trigger user creation if needed
      const credits = await this.getCredits(revenueCatCustomerId)
      
      // If user exists on server, getCredits will return their data
      // If user doesn't exist, it will return default values
      return credits.subscription_status !== 'free' || credits.credits > 0
    } catch (error: any) {
      console.error('CreditService.registerUser error:', error)
      return false
    }
  }

  /**
   * Validate if user has enough credits for an operation
   */
  static async hasEnoughCredits(
    revenueCatCustomerId: string, 
    requiredCredits: number
  ): Promise<boolean> {
    try {
      const { credits } = await this.getCredits(revenueCatCustomerId)
      return credits >= requiredCredits
    } catch (error) {
      console.error('CreditService.hasEnoughCredits error:', error)
      return false
    }
  }
}