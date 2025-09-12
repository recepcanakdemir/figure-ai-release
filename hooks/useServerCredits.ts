/**
 * Figure AI - Server-Side Credits Hook
 * Manages credit operations with server-side validation
 */

import { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { AppState, AppStateStatus } from 'react-native'
import Purchases from 'react-native-purchases'
import { CreditService, CreditResponse, SpendCreditsResponse, CreditResetResponse, PendingChange } from '@/services/credits/creditService'
import { getCurrentCustomerID, getOrCreateCustomerID } from '@/services/customerid'
import { RootState } from '@/store'

export interface UseServerCreditsReturn {
  credits: number
  subscriptionStatus: 'free' | 'active' | 'expired'
  subscriptionType: 'free' | 'weekly' | 'monthly'
  isLoading: boolean
  error: string | null
  periodEnd: string | null
  pendingChange: PendingChange | null
  refreshCredits: () => Promise<void>
  spendCredits: (amount: number, reason?: string) => Promise<SpendCreditsResponse>
  hasEnoughCredits: (amount: number) => boolean
  checkCreditReset: () => Promise<CreditResetResponse>
  hasActivePendingDowngrade: boolean
}

export function useServerCredits(): UseServerCreditsReturn {
  const [credits, setCredits] = useState<number>(0)
  const [subscriptionStatus, setSubscriptionStatus] = useState<'free' | 'active' | 'expired'>('free')
  const [subscriptionType, setSubscriptionType] = useState<'free' | 'weekly' | 'monthly'>('free')
  const [periodEnd, setPeriodEnd] = useState<string | null>(null)
  const [pendingChange, setPendingChange] = useState<PendingChange | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dynamic RevenueCat customer ID state
  const [revenueCatCustomerId, setRevenueCatCustomerId] = useState<string | null>(null)

  // Get RevenueCat customer ID from Redux store (fallback)
  const user = useSelector((state: RootState) => state.user.user)

  /**
   * Get persistent RevenueCat customer ID
   */
  const getRevenueCatCustomerId = useCallback(async (): Promise<string | null> => {
    try {
      // First try to get cached Customer ID from our service
      let customerId = getCurrentCustomerID();
      
      if (customerId) {
        console.log('📋 Using cached Customer ID from service:', customerId);
        return customerId;
      }

      // If not cached, try Redux fallback
      const reduxId = user?.id;
      if (reduxId && reduxId !== '') {
        console.log('🔄 Using Customer ID from Redux:', reduxId);
        return reduxId;
      }

      // Last resort: get/create from service (this should rarely happen)
      console.log('🆘 No Customer ID found, creating new one...');
      customerId = await getOrCreateCustomerID();
      console.log('🆕 Created new Customer ID:', customerId);
      return customerId;
      
    } catch (error) {
      console.error('❌ Failed to get RevenueCat customer ID:', error);
      return null;
    }
  }, [user?.id]);

  /**
   * Refresh credits from server
   */
  const refreshCredits = useCallback(async () => {
    console.log('🔄 useServerCredits: refreshCredits called');
    console.log('🔑 RevenueCat Customer ID:', revenueCatCustomerId);
    
    if (!revenueCatCustomerId) {
      console.log('❌ No RevenueCat customer ID found');
      setError('No RevenueCat customer ID found')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      console.log('📡 Calling CreditService.getCredits...');
      const response: CreditResponse = await CreditService.getCredits(revenueCatCustomerId)
      console.log('✅ Credits response:', response);
      
      setCredits(response.credits)
      setSubscriptionStatus(response.subscription_status)
      setSubscriptionType(response.subscription_type)
      setPeriodEnd(response.period_end || null)
      setPendingChange(response.pending_change || null)
      
      console.log('✅ Credits updated:', response.credits);
    } catch (err: any) {
      console.error('❌ useServerCredits.refreshCredits error:', err)
      setError(err.message || 'Failed to fetch credits')
    } finally {
      setIsLoading(false)
    }
  }, [revenueCatCustomerId])

  /**
   * Spend credits on server
   */
  const spendCredits = useCallback(async (amount: number, reason: string = 'AI generation'): Promise<SpendCreditsResponse> => {
    if (!revenueCatCustomerId) {
      return {
        success: false,
        remaining_credits: 0,
        error: 'No RevenueCat customer ID found'
      }
    }

    try {
      const response = await CreditService.spendCredits(revenueCatCustomerId, amount, reason)
      
      if (response.success) {
        // Update local state with new balance
        setCredits(response.remaining_credits)
      }
      
      return response
    } catch (err: any) {
      return {
        success: false,
        remaining_credits: credits,
        error: err.message || 'Failed to spend credits'
      }
    }
  }, [revenueCatCustomerId, credits])

  /**
   * Check if user has enough credits for an operation
   */
  const hasEnoughCredits = useCallback((amount: number): boolean => {
    return credits >= amount
  }, [credits])
  
  /**
   * Check if user has an active pending downgrade
   */
  const hasActivePendingDowngrade: boolean = pendingChange !== null && pendingChange?.reason === 'downgrade'

  /**
   * Check and handle credit reset (for both weekly and monthly)
   */
  const checkCreditReset = useCallback(async (): Promise<CreditResetResponse> => {
    if (!revenueCatCustomerId) {
      return { reset_performed: false, credits: 0 }
    }

    try {
      const resetResponse = await CreditService.checkCreditReset(revenueCatCustomerId)
      
      if (resetResponse.reset_performed) {
        console.log(`Credit reset applied: ${resetResponse.credits} credits`)
        setCredits(resetResponse.credits)
      }
      
      return resetResponse
    } catch (err: any) {
      console.error('Credit reset check failed:', err)
      return { reset_performed: false, credits }
    }
  }, [revenueCatCustomerId, credits])

  /**
   * Initialize customer ID and credits on component mount
   */
  useEffect(() => {
    const initializeCustomerId = async () => {
      console.log('🚀 Initializing RevenueCat customer ID...');
      const customerId = await getRevenueCatCustomerId();
      
      if (customerId) {
        setRevenueCatCustomerId(customerId);
      } else {
        console.warn('⚠️ No RevenueCat customer ID found');
        setError('Unable to get RevenueCat customer ID');
        setIsLoading(false);
      }
    };
    
    initializeCustomerId();
  }, [getRevenueCatCustomerId]);

  /**
   * Refresh credits when customer ID is available
   */
  useEffect(() => {
    if (revenueCatCustomerId) {
      refreshCredits()
    }
  }, [revenueCatCustomerId, refreshCredits])

  /**
   * Check credit reset on app focus (for active subscribers)
   */
  useEffect(() => {
    if (subscriptionStatus === 'active' && (subscriptionType === 'weekly' || subscriptionType === 'monthly')) {
      checkCreditReset()
    }
  }, [subscriptionStatus, subscriptionType, checkCreditReset])

  /**
   * Real-time credit sync on app focus/foreground
   */
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && revenueCatCustomerId) {
        console.log('🔄 App became active - refreshing credits');
        refreshCredits();
        
        // Also check for credit reset if subscribed
        if (subscriptionStatus === 'active') {
          checkCreditReset();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [revenueCatCustomerId, subscriptionStatus, refreshCredits, checkCreditReset])

  return {
    credits,
    subscriptionStatus,
    subscriptionType,
    isLoading,
    error,
    periodEnd,
    pendingChange,
    refreshCredits,
    spendCredits,
    hasEnoughCredits,
    checkCreditReset,
    hasActivePendingDowngrade
  }
}