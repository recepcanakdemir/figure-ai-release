/**
 * Figure AI - RevenueCat Service
 * Handles all subscription and purchase logic through RevenueCat
 */

import Purchases, { 
  PurchasesOffering, 
  PurchasesPackage, 
  CustomerInfo,
  LOG_LEVEL
} from 'react-native-purchases';
import { Platform } from 'react-native';

// RevenueCat API Keys - Replace with your actual keys
const REVENUECAT_API_KEYS = {
  ios: 'appl_ULAFyZcuucpghoxQbUqXVoJFWBH', // Replace with your iOS API key
  android: 'goog_YOUR_ANDROID_API_KEY_HERE', // Replace with your Android API key
};

// RevenueCat will use custom Customer ID via logIn() method
// APP_USER_ID is no longer needed - we use CustomerIDService instead

export interface SubscriptionProduct {
  identifier: string;
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
  subscriptionPeriod?: string;
  introductoryPrice?: {
    price: string;
    period: string;
    cycles: number;
  };
  packageType: string;
  rcPackage: PurchasesPackage; // Original RevenueCat package
}

export interface SubscriptionStatus {
  isActive: boolean;
  productIdentifier?: string;
  expirationDate?: string;
  willRenew: boolean;
  entitlements: string[];
}

class RevenueCatService {
  private isInitialized = false;

  /**
   * Initialize RevenueCat SDK
   */
  async initialize(): Promise<void> {
    try {
      console.log('Initializing RevenueCat...');
      
      // Configure RevenueCat without user ID (will use logIn later with custom ID)
      await Purchases.configure({
        apiKey: Platform.OS === 'ios' ? REVENUECAT_API_KEYS.ios : REVENUECAT_API_KEYS.android,
        // No appUserID - we'll use logIn() with persistent Customer ID via CustomerIDService
      });

      // Set debug logs (disable in production)
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      // Identify user if you have user accounts
      // await this.identifyUser('user_id_here');

      this.isInitialized = true;
      console.log('RevenueCat initialized successfully');
      
    } catch (error) {
      console.error('Failed to initialize RevenueCat:', error);
      throw error;
    }
  }

  /**
   * Identify user (call this when user logs in)
   */
  async identifyUser(userId: string): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.logIn(userId);
      console.log('User identified:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Failed to identify user:', error);
      throw error;
    }
  }

  /**
   * Log out user (call this when user logs out)
   */
  async logOut(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.logOut();
      console.log('User logged out:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Failed to log out user:', error);
      throw error;
    }
  }

  /**
   * Get available offerings and products
   */
  async getOfferings(): Promise<SubscriptionProduct[]> {
    try {
      if (!this.isInitialized) {
        throw new Error('RevenueCat not initialized. Call initialize() first.');
      }

      const offerings = await Purchases.getOfferings();
      console.log('Available offerings:', offerings);

      // Get current offering (you can specify which offering to use)
      const currentOffering = offerings.current;
      
      if (!currentOffering) {
        console.warn('No current offering found');
        return [];
      }

      // Convert RevenueCat packages to our format
      const products: SubscriptionProduct[] = [];
      
      // Add available packages from the current offering
      Object.values(currentOffering.availablePackages).forEach((rcPackage: PurchasesPackage) => {
        products.push({
          identifier: rcPackage.product.identifier,
          title: rcPackage.product.title,
          description: rcPackage.product.description,
          price: rcPackage.product.priceString,
          priceAmountMicros: rcPackage.product.price,
          priceCurrencyCode: rcPackage.product.currencyCode,
          subscriptionPeriod: rcPackage.product.subscriptionPeriod || undefined,
          introductoryPrice: rcPackage.product.introPrice ? {
            price: rcPackage.product.introPrice.priceString,
            period: rcPackage.product.introPrice.periodUnit,
            cycles: rcPackage.product.introPrice.periodNumberOfUnits,
          } : undefined,
          packageType: rcPackage.packageType,
          rcPackage: rcPackage,
        });
      });

      console.log('Converted products:', products);
      return products;

    } catch (error) {
      console.error('Failed to get offerings:', error);
      throw error;
    }
  }

  /**
   * Purchase a subscription
   */
  async purchaseSubscription(product: SubscriptionProduct): Promise<CustomerInfo> {
    try {
      console.log('Attempting to purchase:', product.identifier);
      
      const { customerInfo } = await Purchases.purchasePackage(product.rcPackage);
      
      console.log('Purchase successful:', customerInfo);
      return customerInfo;

    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // Handle specific error cases
      if (error.userCancelled) {
        throw new Error('Purchase was cancelled by user');
      } else if (error.domain === 'SKErrorDomain' && error.code === 2) {
        throw new Error('Payment cancelled');
      } else {
        throw new Error(`Purchase failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  /**
   * Restore purchases
   */
  async restorePurchases(): Promise<CustomerInfo> {
    try {
      console.log('Restoring purchases...');
      const customerInfo = await Purchases.restorePurchases();
      console.log('Purchases restored:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Failed to restore purchases:', error);
      throw error;
    }
  }

  /**
   * Get current customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('Customer info:', customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('Failed to get customer info:', error);
      throw error;
    }
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    try {
      const customerInfo = await this.getCustomerInfo();
      
      // Check if user has any active subscriptions
      const activeSubscriptions = customerInfo.activeSubscriptions;
      const entitlements = Object.keys(customerInfo.entitlements.active);
      
      const isActive = activeSubscriptions.length > 0 && entitlements.length > 0;
      
      let productIdentifier: string | undefined;
      let expirationDate: string | undefined;
      let willRenew = false;

      if (isActive && entitlements.length > 0) {
        // Get the first active entitlement (you might want to check for specific entitlements)
        const entitlementInfo = customerInfo.entitlements.active[entitlements[0]];
        productIdentifier = entitlementInfo.productIdentifier;
        expirationDate = entitlementInfo.expirationDate || undefined;
        willRenew = entitlementInfo.willRenew;
      }

      return {
        isActive,
        productIdentifier,
        expirationDate,
        willRenew,
        entitlements,
      };
      
    } catch (error) {
      console.error('Failed to get subscription status:', error);
      return {
        isActive: false,
        willRenew: false,
        entitlements: [],
      };
    }
  }

  /**
   * Check if user has specific entitlement
   */
  async hasEntitlement(entitlementId: string): Promise<boolean> {
    try {
      const customerInfo = await this.getCustomerInfo();
      return customerInfo.entitlements.active[entitlementId] !== undefined;
    } catch (error) {
      console.error('Failed to check entitlement:', error);
      return false;
    }
  }

  /**
   * Get promotional offer (iOS only)
   */
  async getPromotionalOffer(productId: string, discountId: string): Promise<any> {
    try {
      if (Platform.OS !== 'ios') {
        console.warn('Promotional offers are iOS only');
        return null;
      }

      // Implementation depends on your promotional offer setup
      // This is a placeholder - implement based on your needs
      console.log('Getting promotional offer for:', productId, discountId);
      return null;
    } catch (error) {
      console.error('Failed to get promotional offer:', error);
      return null;
    }
  }
}

// Export singleton instance
export const revenueCatService = new RevenueCatService();

// Export types
export type { CustomerInfo, PurchasesOffering, PurchasesPackage };

// Convenience functions
export const initializeRevenueCat = () => revenueCatService.initialize();
export const getSubscriptionProducts = () => revenueCatService.getOfferings();
export const purchaseSubscription = (product: SubscriptionProduct) => revenueCatService.purchaseSubscription(product);
export const restorePurchases = () => revenueCatService.restorePurchases();
export const getSubscriptionStatus = () => revenueCatService.getSubscriptionStatus();
export const hasEntitlement = (entitlementId: string) => revenueCatService.hasEntitlement(entitlementId);