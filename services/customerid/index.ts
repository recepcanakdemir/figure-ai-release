/**
 * Figure AI - Persistent Customer ID Service
 * Ensures consistent RevenueCat Customer ID across app sessions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases from 'react-native-purchases';

const CUSTOMER_ID_KEY = 'figure_ai_customer_id';
const ID_PREFIX = 'figure_ai';

export class CustomerIDService {
  private static customerID: string | null = null;

  /**
   * Get or create a persistent Customer ID
   * This ID will be used consistently across app sessions
   */
  static async getOrCreateCustomerID(): Promise<string> {
    try {
      // Return cached ID if available
      if (this.customerID) {
        console.log('📋 Using cached Customer ID:', this.customerID);
        return this.customerID;
      }

      // Try to get existing ID from device storage
      const existingID = await AsyncStorage.getItem(CUSTOMER_ID_KEY);
      
      if (existingID && existingID.trim() !== '') {
        console.log('📱 Retrieved existing Customer ID from storage:', existingID);
        this.customerID = existingID;
        return existingID;
      }

      // Generate new stable Customer ID
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 9);
      const newCustomerID = `${ID_PREFIX}_${timestamp}_${randomSuffix}`;

      console.log('🆕 Generated new Customer ID:', newCustomerID);

      // Save to device storage
      await AsyncStorage.setItem(CUSTOMER_ID_KEY, newCustomerID);
      
      // Cache in memory
      this.customerID = newCustomerID;

      return newCustomerID;

    } catch (error) {
      console.error('❌ Error in getOrCreateCustomerID:', error);
      
      // Fallback: use timestamp-based ID without storage
      const fallbackID = `${ID_PREFIX}_fallback_${Date.now()}`;
      console.warn('⚠️ Using fallback Customer ID:', fallbackID);
      this.customerID = fallbackID;
      return fallbackID;
    }
  }

  /**
   * Initialize RevenueCat with persistent Customer ID
   */
  static async initializeWithCustomerID(): Promise<string> {
    try {
      // Get stable Customer ID
      const customerID = await this.getOrCreateCustomerID();
      
      console.log('🔐 Logging in to RevenueCat with Customer ID:', customerID);
      
      // Login to RevenueCat with our stable ID
      const { customerInfo } = await Purchases.logIn(customerID);
      
      console.log('✅ RevenueCat login successful');
      console.log('📊 Customer info original app user ID:', customerInfo.originalAppUserId);
      console.log('📊 Customer info first seen:', customerInfo.firstSeen);
      
      // Verify the ID matches what we expect
      if (customerInfo.originalAppUserId !== customerID) {
        console.warn('⚠️ RevenueCat returned different Customer ID than expected!');
        console.warn('Expected:', customerID);
        console.warn('Received:', customerInfo.originalAppUserId);
      }

      return customerID;

    } catch (error) {
      console.error('❌ Error initializing RevenueCat with Customer ID:', error);
      throw error;
    }
  }

  /**
   * Get current Customer ID (if available)
   */
  static getCurrentCustomerID(): string | null {
    return this.customerID;
  }

  /**
   * Clear Customer ID (for testing/reset purposes)
   */
  static async clearCustomerID(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CUSTOMER_ID_KEY);
      this.customerID = null;
      console.log('🗑️ Customer ID cleared from storage');
    } catch (error) {
      console.error('❌ Error clearing Customer ID:', error);
    }
  }

  /**
   * Debug: Get stored Customer ID without side effects
   */
  static async getStoredCustomerID(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CUSTOMER_ID_KEY);
    } catch (error) {
      console.error('❌ Error getting stored Customer ID:', error);
      return null;
    }
  }

  /**
   * Restore purchases with current Customer ID
   */
  static async restorePurchases(): Promise<void> {
    try {
      console.log('🔄 Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      console.log('✅ Purchases restored successfully');
      console.log('📊 Active subscriptions:', customerInfo.activeSubscriptions);
      console.log('📊 Active entitlements:', Object.keys(customerInfo.entitlements.active));
    } catch (error) {
      console.error('❌ Error restoring purchases:', error);
      throw error;
    }
  }
}

// Convenience exports
export const getOrCreateCustomerID = () => CustomerIDService.getOrCreateCustomerID();
export const initializeWithCustomerID = () => CustomerIDService.initializeWithCustomerID();
export const getCurrentCustomerID = () => CustomerIDService.getCurrentCustomerID();
export const clearCustomerID = () => CustomerIDService.clearCustomerID();
export const restorePurchases = () => CustomerIDService.restorePurchases();