/**
 * Figure AI - RevenueCat Integration Hook
 * Handles subscription purchases and syncs with server-side credit system
 */

import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { revenueCatService, SubscriptionProduct } from '@/services/revenuecat'
import { getCurrentCustomerID, getOrCreateCustomerID } from '@/services/customerid'
import { useServerCredits } from './useServerCredits'
import { updateRevenueCatSubscription } from '@/store/slices/userSlice'
import { RootState } from '@/store'
import type { CustomerInfo } from 'react-native-purchases'

export interface UseRevenueCatReturn {
  // State
  isInitialized: boolean
  isLoading: boolean
  error: string | null
  products: SubscriptionProduct[]
  customerId: string | null
  
  // Subscription Status
  hasActiveSubscription: boolean
  currentProductId: string | null
  subscriptionType: 'free' | 'weekly' | 'monthly'
  
  // Actions  
  initializeRevenueCat: () => Promise<void>
  loadProducts: () => Promise<void>
  purchaseProduct: (product: SubscriptionProduct) => Promise<boolean>
  restorePurchases: () => Promise<boolean>
  checkSubscriptionStatus: () => Promise<void>
  
  // Utilities
  getProductById: (productId: string) => SubscriptionProduct | undefined
  isProductActive: (productId: string) => boolean
}

export function useRevenueCat(): UseRevenueCatReturn {
  // State
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<SubscriptionProduct[]>([])
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false)
  const [currentProductId, setCurrentProductId] = useState<string | null>(null)
  
  // Hooks
  const dispatch = useDispatch()
  const { refreshCredits } = useServerCredits()
  const user = useSelector((state: RootState) => state.user.user)
  
  // Determine subscription type from product ID
  const subscriptionType = useCallback((): 'free' | 'weekly' | 'monthly' => {
    if (!currentProductId || !hasActiveSubscription) return 'free'
    
    if (currentProductId.includes('499') || currentProductId.includes('week')) {
      return 'weekly'
    } else if (currentProductId.includes('1999') || currentProductId.includes('month')) {
      return 'monthly'
    }
    
    return 'free'
  }, [currentProductId, hasActiveSubscription])()

  /**
   * Initialize RevenueCat and customer ID
   */
  const initializeRevenueCat = useCallback(async () => {
    console.log('🚀 Initializing RevenueCat...')
    setIsLoading(true)
    setError(null)
    
    try {
      // Initialize RevenueCat SDK
      await revenueCatService.initialize()
      console.log('✅ RevenueCat SDK initialized')
      
      // Get or create persistent customer ID
      let persistentCustomerId = getCurrentCustomerID()
      
      if (!persistentCustomerId) {
        console.log('🆕 Creating new customer ID...')
        persistentCustomerId = await getOrCreateCustomerID()
      }
      
      console.log('🔑 Using customer ID:', persistentCustomerId)
      setCustomerId(persistentCustomerId)
      
      // Identify user in RevenueCat with our custom ID
      await revenueCatService.identifyUser(persistentCustomerId)
      console.log('✅ User identified in RevenueCat')
      
      setIsInitialized(true)
      
      // Check current subscription status
      await checkSubscriptionStatus()
      
    } catch (err: any) {
      console.error('❌ RevenueCat initialization failed:', err)
      setError(err.message || 'Failed to initialize RevenueCat')
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Load available subscription products
   */
  const loadProducts = useCallback(async () => {
    if (!isInitialized) {
      console.warn('⚠️ RevenueCat not initialized')
      return
    }
    
    console.log('📦 Loading subscription products...')
    setIsLoading(true)
    
    try {
      const availableProducts = await revenueCatService.getOfferings()
      setProducts(availableProducts)
      console.log('✅ Loaded products:', availableProducts.length)
    } catch (err: any) {
      console.error('❌ Failed to load products:', err)
      setError(err.message || 'Failed to load products')
    } finally {
      setIsLoading(false)
    }
  }, [isInitialized])

  /**
   * Check current subscription status
   */
  const checkSubscriptionStatus = useCallback(async () => {
    if (!isInitialized) return
    
    console.log('🔍 Checking subscription status...')
    
    try {
      const customerInfo = await revenueCatService.getCustomerInfo()
      await processPurchaseResult(customerInfo)
    } catch (err: any) {
      console.error('❌ Failed to check subscription status:', err)
    }
  }, [isInitialized])

  /**
   * Process RevenueCat customer info and update state
   */
  const processPurchaseResult = useCallback(async (customerInfo: CustomerInfo) => {
    const activeSubscriptions = customerInfo.activeSubscriptions
    const entitlements = Object.keys(customerInfo.entitlements.active)
    
    const isActive = activeSubscriptions.length > 0 && entitlements.length > 0
    setHasActiveSubscription(isActive)
    
    let productId: string | null = null
    let subscriptionStatus: 'free' | 'active' = 'free'
    
    if (isActive && entitlements.length > 0) {
      const entitlementInfo = customerInfo.entitlements.active[entitlements[0]]
      productId = entitlementInfo.productIdentifier
      subscriptionStatus = 'active'
    }
    
    setCurrentProductId(productId)
    
    // Update Redux store
    dispatch(updateRevenueCatSubscription({
      status: subscriptionStatus,
      customerId: customerId || undefined,
      productId: productId || undefined,
      willRenew: isActive ? customerInfo.entitlements.active[entitlements[0]]?.willRenew : false
    }))
    
    console.log('✅ Subscription status updated:', {
      isActive,
      productId,
      subscriptionType: subscriptionType
    })
  }, [customerId, dispatch, subscriptionType])

  /**
   * Purchase a subscription product
   */
  const purchaseProduct = useCallback(async (product: SubscriptionProduct): Promise<boolean> => {
    console.log('💳 Purchasing product:', product.identifier)
    setIsLoading(true)
    setError(null)
    
    try {
      const customerInfo = await revenueCatService.purchaseSubscription(product)
      console.log('✅ Purchase successful:', customerInfo)
      
      // Update subscription status immediately
      await processPurchaseResult(customerInfo)
      
      // Aggressive credit refresh after purchase
      // Multiple attempts to ensure webhook processing is captured
      const refreshAttempts = [1000, 3000, 5000, 8000]; // 1s, 3s, 5s, 8s
      refreshAttempts.forEach((delay) => {
        setTimeout(() => {
          console.log(`🔄 Post-purchase credit refresh attempt (${delay}ms)`);
          refreshCredits();
        }, delay);
      });
      
      return true
      
    } catch (err: any) {
      console.error('❌ Purchase failed:', err)
      setError(err.message || 'Purchase failed')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [refreshCredits, processPurchaseResult])

  /**
   * Restore previous purchases
   */
  const restorePurchases = useCallback(async (): Promise<boolean> => {
    console.log('🔄 Restoring purchases...')
    setIsLoading(true)
    setError(null)
    
    try {
      const customerInfo = await revenueCatService.restorePurchases()
      console.log('✅ Purchases restored:', customerInfo)
      
      await processPurchaseResult(customerInfo)
      
      // Refresh credits from server
      await refreshCredits()
      
      return hasActiveSubscription
      
    } catch (err: any) {
      console.error('❌ Restore failed:', err)
      setError(err.message || 'Failed to restore purchases')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [refreshCredits, processPurchaseResult, hasActiveSubscription])

  /**
   * Get product by ID
   */
  const getProductById = useCallback((productId: string): SubscriptionProduct | undefined => {
    return products.find(p => p.identifier === productId)
  }, [products])

  /**
   * Check if specific product is active
   */
  const isProductActive = useCallback((productId: string): boolean => {
    return hasActiveSubscription && currentProductId === productId
  }, [hasActiveSubscription, currentProductId])

  // Initialize on mount
  useEffect(() => {
    initializeRevenueCat()
  }, [initializeRevenueCat])

  // Load products after initialization
  useEffect(() => {
    if (isInitialized) {
      loadProducts()
    }
  }, [isInitialized, loadProducts])

  // Periodic subscription status check (every 5 minutes when app is active)
  useEffect(() => {
    if (!isInitialized) return
    
    const interval = setInterval(() => {
      console.log('🔄 Periodic subscription status check...')
      checkSubscriptionStatus()
    }, 5 * 60 * 1000) // 5 minutes
    
    return () => clearInterval(interval)
  }, [isInitialized, checkSubscriptionStatus])

  return {
    // State
    isInitialized,
    isLoading,
    error,
    products,
    customerId,
    
    // Subscription Status
    hasActiveSubscription,
    currentProductId,
    subscriptionType,
    
    // Actions
    initializeRevenueCat,
    loadProducts,
    purchaseProduct,
    restorePurchases,
    checkSubscriptionStatus,
    
    // Utilities
    getProductById,
    isProductActive
  }
}