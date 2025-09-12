/**
 * Figure AI - User slice for Redux store
 * Manages user data and RevenueCat customer ID (Credits now handled server-side)
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User, UserState, SubscriptionProduct, SubscriptionStatus, SubscriptionType } from '@/types';

// Initial user - RevenueCat Customer ID will be set after initialization
const createInitialUser = (): User => ({
  id: '', // Will be set to RevenueCat Customer ID after initialization
  subscriptionStatus: 'free',
  credits: 0, // DEPRECATED: Credits now managed server-side
  weeklyCreditsResetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  lastActiveAt: new Date().toISOString(),
});

// Subscription products configuration
const subscriptionProducts: SubscriptionProduct[] = [
  {
    id: 'weekly_subscription',
    type: 'weekly',
    price: 4.99,
    title: 'Weekly Pro',
    description: '25 credits per week',
    features: [
      '25 credits per week',
      'Save to favorites',
      'Priority processing',
      'Auto-renewal',
    ],
    creditsPerWeek: 25,
  },
  {
    id: 'monthly_subscription',
    type: 'monthly',
    price: 19.99,
    title: 'Monthly Pro',
    description: '160 credits monthly (40 credits/week)',
    features: [
      '160 credits per month',
      '40 credits per week',
      'Save to favorites',
      'Better value - Save 20%!',
    ],
    creditsPerWeek: 40,
  },
];

const initialState: UserState = {
  user: createInitialUser(),
  isLoading: false,
  error: null,
  subscriptionProducts,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // User actions
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    
    updateUserEmail: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.email = action.payload;
      }
    },
    
    updateLastActive: (state) => {
      if (state.user) {
        state.user.lastActiveAt = new Date().toISOString();
      }
    },
    
    // RevenueCat Customer ID management
    setRevenueCatCustomerId: (state, action: PayloadAction<string>) => {
      if (state.user) {
        state.user.id = action.payload; // Store RevenueCat customer ID
      }
    },
    
    // Subscription management (Credits handled server-side via RevenueCat webhook)
    updateSubscription: (state, action: PayloadAction<{
      status: SubscriptionStatus;
      type?: SubscriptionType;
      productId?: string;
      expirationDate?: string;
      willRenew?: boolean;
      entitlements?: string[];
    }>) => {
      if (state.user) {
        state.user.subscriptionStatus = action.payload.status;
        if (action.payload.type) {
          state.user.subscriptionType = action.payload.type;
        }
        // NOTE: Credits are now managed server-side via RevenueCat webhook
        // No local credit granting needed
      }
    },

    // RevenueCat subscription management (Server-side credits)
    updateRevenueCatSubscription: (state, action: PayloadAction<{
      status: 'active' | 'inactive' | 'free';
      customerId?: string;
      productId?: string;
      expirationDate?: string;
      willRenew?: boolean;
      entitlements?: string[];
    }>) => {
      if (state.user) {
        state.user.subscriptionStatus = action.payload.status;
        
        // Store RevenueCat customer ID if provided
        if (action.payload.customerId) {
          state.user.id = action.payload.customerId;
        }
        
        // Determine subscription type from product ID
        if (action.payload.productId) {
          if (action.payload.productId.includes('weekly') || action.payload.productId.includes('week')) {
            state.user.subscriptionType = 'weekly';
          } else if (action.payload.productId.includes('monthly') || action.payload.productId.includes('month')) {
            state.user.subscriptionType = 'monthly';
          }
        }
        
        // NOTE: Credits are now managed server-side via RevenueCat webhook
        // RevenueCat will send webhook → Supabase → Credits updated automatically
      }
    },
    
    // Loading and error states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Development helper - reset user data
    resetUserData: (state) => {
      state.user = createInitialUser();
      state.error = null;
    },
  },
});

export const {
  setUser,
  updateUserEmail,
  updateLastActive,
  setRevenueCatCustomerId,
  updateSubscription,
  updateRevenueCatSubscription,
  setLoading,
  setError,
  resetUserData,
} = userSlice.actions;

// DEPRECATED: Local credit actions removed
// Use useServerCredits hook instead
// - useCredits → useServerCredits().spendCredits()
// - addCredits → Server-side via RevenueCat webhook
// - resetWeeklyCredits → Server-side via checkWeeklyReset()

export default userSlice.reducer;