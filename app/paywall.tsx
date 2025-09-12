import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { RootState } from '@/store';
import { updateSubscription, setRevenueCatCustomerId } from '@/store/slices/userSlice';
import { completeOnboarding } from '@/store/slices/settingsSlice';
import { SubscriptionType } from '@/types';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useServerCredits } from '@/hooks/useServerCredits';

export default function PaywallScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();

  const subscriptionProducts = useSelector((state: RootState) => state.user.subscriptionProducts);
  const { 
    isLoading, 
    purchaseProduct, 
    restorePurchases, 
    products,
    hasActiveSubscription,
    subscriptionType: currentSubscriptionType,
    customerId
  } = useRevenueCat();
  
  const { 
    spendCredits
  } = useServerCredits();
  
  // Get weekly and monthly products from RevenueCat products
  const weeklyProduct = products.find(p => p.identifier.includes('499') || p.identifier.includes('week'));
  const monthlyProduct = products.find(p => p.identifier.includes('1999') || p.identifier.includes('month'));

  const [selectedPlan, setSelectedPlan] = useState<SubscriptionType>('weekly');
  const [isProcessing, setIsProcessing] = useState(false);

  // Check if coming from onboarding, generation, or other source
  const source = params.source as string;
  const isFromOnboarding = source === 'onboarding';
  const isFromGeneration = source === 'generation';

  // Get result params if coming from generation
  const resultParams = isFromGeneration ? {
    originalImageUri: params.originalImageUri as string,
    generatedImageUri: params.generatedImageUri as string,
    prompt: params.prompt as string,
    customPrompt: params.customPrompt as string,
    aiModel: params.aiModel as string,
  } : null;

  // Get credits required for this generation
  const creditsRequired = isFromGeneration ? parseInt(params.creditsRequired as string || '1', 10) : 0;

  // Use RevenueCat products if available, fallback to mock data
  const weeklyPlan = weeklyProduct || subscriptionProducts.find(p => p.type === 'weekly');
  const monthlyPlan = monthlyProduct || subscriptionProducts.find(p => p.type === 'monthly');
  
  // Show upgrade option for weekly subscribers
  const showUpgradeOption = hasActiveSubscription && currentSubscriptionType === 'weekly';

  // Map RevenueCat products to our UI format
  const currentPlan = selectedPlan === 'weekly'
    ? weeklyProduct
      ? {
        title: weeklyProduct.title,
        price: parseFloat(weeklyProduct.price.replace('$', '')),
        description: weeklyProduct.description,
        features: [
          '25 credits per week',
          'Save to favorites',
          'Priority processing',
          'Auto-renewal',
        ]
      }
      : subscriptionProducts.find(p => p.type === 'weekly')
    : monthlyProduct
      ? {
        title: monthlyProduct.title,
        price: parseFloat(monthlyProduct.price.replace('$', '')),
        description: monthlyProduct.description,
        features: [
          '160 credits per month',
          '40 credits per week',
          'Save to favorites',
          'Better value - Save 20%!',
        ]
      }
      : subscriptionProducts.find(p => p.type === 'monthly');

  const handleClose = () => {
    if (isFromOnboarding) {
      // Mark onboarding as completed and go to main app
      dispatch(completeOnboarding());
      router.replace('/(tabs)');
    } else if (isFromGeneration) {
      // Go back to camera screen
      router.replace('/(tabs)/camera');
    } else {
      router.back();
    }
  };

  const handleSubscribe = async () => {
    if (!currentPlan) return;

    setIsProcessing(true);

    try {
      // Use RevenueCat if products are available
      const productToPurchase = selectedPlan === 'weekly' ? weeklyProduct : monthlyProduct;

      let revenueCatCustomerId: string | undefined;

      if (productToPurchase) {
        // Real RevenueCat purchase
        console.log('Purchasing with RevenueCat:', productToPurchase.identifier);
        const success = await purchaseProduct(productToPurchase);

        if (!success) {
          console.log('Purchase was cancelled');
          setIsProcessing(false);
          return;
        }

        // Get the RevenueCat customer ID from the hook
        console.log('Getting RevenueCat customer ID from hook...');
        revenueCatCustomerId = customerId || 'unknown';
        console.log('RevenueCat Customer ID:', revenueCatCustomerId);
      } else {
        // Fallback to mock subscription (for development)
        console.log('Using mock subscription (no RevenueCat products available)');
        await new Promise(resolve => setTimeout(resolve, 1500));
        revenueCatCustomerId = 'dev_customer_' + Date.now();
      }

      // Store RevenueCat customer ID in Redux for server credit calls
      if (revenueCatCustomerId) {
        dispatch(setRevenueCatCustomerId(revenueCatCustomerId));
      }

      // Update subscription status in Redux  
      dispatch(updateSubscription({
        status: 'active',
        type: selectedPlan
      }));

      // Handle navigation after successful subscription
      if (isFromGeneration && resultParams) {
        // Server-side credit spending for the generation
        console.log(`Spending ${creditsRequired} credits on server after subscription...`);
        
        if (revenueCatCustomerId) {
          const spendResult = await spendCredits(Number(creditsRequired));
          
          if (spendResult.success) {
            console.log(`Credits spent successfully on server. Remaining: ${spendResult.remaining_credits}`);
          } else {
            console.warn('Failed to spend credits after subscription:', spendResult.error);
            // Continue anyway - webhook might handle credit granting with delay
          }
        }

        // Show result screen with the generated figurine
        router.replace({
          pathname: '/result',
          params: resultParams
        });
      } else {
        Alert.alert(
          t('paywall.welcomeTitle'),
          t('paywall.welcomeMessage').replace('{plan}', selectedPlan),
          [
            {
              text: t('paywall.startCreating'),
              onPress: () => {
                if (isFromOnboarding) {
                  dispatch(completeOnboarding());
                  router.replace('/(tabs)');
                } else {
                  router.back();
                }
              }
            }
          ]
        );
      }

    } catch (error: any) {
      console.error('Purchase failed:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('paywall.subscriptionFailed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      setIsProcessing(true);
      const hasActiveSubscription = await restorePurchases();

      if (hasActiveSubscription) {
        Alert.alert(
          t('paywall.restoreSuccessTitle'),
          t('paywall.restoreSuccessMessage'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('paywall.restoreNoSubscriptionsTitle'),
          t('paywall.restoreNoSubscriptionsMessage'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error: any) {
      console.error('Restore failed:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('paywall.restoreFailed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Close Button */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{t('paywall.title')}</Text>
          <Pressable style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroImageContainer}>
            <Image
              source={require('../assets/images/icon.png')}
              style={styles.heroImage}
            />
          </View>
          <Text style={styles.heroTitle}>
            {isFromGeneration
              ? t('paywall.heroTitleGeneration')
              : t('paywall.heroTitle')
            }
          </Text>
        </View>


        {/* Selected Plan Features */}
        {currentPlan && (
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>{t('paywall.featuresTitle').replace('{plan}', currentPlan.title)}</Text>
            {currentPlan.features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Text style={styles.featureBullet}>✓</Text>
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>
        )}




        {/* Pricing Plans */}

        <View style={styles.plansContainer}>

          {/* Monthly Plan */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'monthly' && styles.planCardSelected
            ]}
            onPress={() => setSelectedPlan('monthly')}
          >
            <View style={styles.planHeader}>
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioButton,
                  selectedPlan === 'monthly' && styles.radioButtonSelected
                ]}>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planMainTitle}>{t('paywall.monthly')}</Text>
                  <Text style={styles.planTitle}>
                    {monthlyProduct ? monthlyProduct.price : `$${typeof monthlyPlan?.price === 'number' ? monthlyPlan.price.toFixed(2) : monthlyPlan?.price || '0.00'}`}
                    <Text style={styles.planSubtitle}>{t('paywall.monthlyPrice')}</Text>
                  </Text>
                  <Text style={styles.planSubtitle}>
                    {monthlyProduct ? monthlyProduct.description : monthlyPlan?.description}
                  </Text>
                </View>
              </View>
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>{t('paywall.save20')}</Text>
              </View>
            </View>
          </Pressable>
          {/* Weekly Plan */}
          <Pressable
            style={[
              styles.planCard,
              selectedPlan === 'weekly' && styles.planCardSelected
            ]}
            onPress={() => setSelectedPlan('weekly')}
          >
            <View style={styles.planHeader}>
              <View style={styles.radioContainer}>
                <View style={[
                  styles.radioButton,
                  selectedPlan === 'weekly' && styles.radioButtonSelected
                ]}>
                  {selectedPlan === 'weekly' && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <View style={styles.planInfo}>
                  <Text style={styles.planMainTitle}>{t('paywall.weekly')}</Text>
                  <Text style={styles.planTitle}>
                    {weeklyProduct ? weeklyProduct.price : `$${typeof weeklyPlan?.price === 'number' ? weeklyPlan.price.toFixed(2) : weeklyPlan?.price || '0.00'}`}
                    <Text style={styles.planSubtitle}>{t('paywall.weeklyPrice')}</Text>
                  </Text>
                  <Text style={styles.planSubtitle}>
                    {weeklyProduct ? weeklyProduct.description : weeklyPlan?.description}
                  </Text>
                </View>
              </View>
            </View>
          </Pressable>

        </View>


        {/* Subscribe Button */}
        <View style={styles.subscribeSection}>
          <Pressable
            style={[styles.subscribeButton, (isProcessing || isLoading) && styles.subscribeButtonDisabled]}
            onPress={handleSubscribe}
            disabled={isProcessing || isLoading}
          >
            <Text style={styles.subscribeText}>
              {(isProcessing || isLoading)
                ? t('paywall.processing')
                : t('paywall.subscribe').replace('{plan}', currentPlan?.title || 'Pro')
              }
            </Text>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable style={styles.restoreButton} onPress={handleRestorePurchases}>
            <Text style={styles.restoreText}>{t('paywall.restorePurchases')}</Text>
          </Pressable>
          <Text style={styles.separator}>•</Text>


          <Pressable
            onPress={() => {
              Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/');
            }}
          >
            <Text style={styles.footerLinkText}>
              Terms & Conditions
            </Text>
          </Pressable>

          <Text style={styles.separator}>•</Text>


          <Pressable
            onPress={() => {
              Linking.openURL('https://www.freeprivacypolicy.com/live/92c38279-c2fd-4006-a61e-59dd6ee684ab');
            }}
          >
            <Text style={styles.footerLinkText}>
             Privacy Policy 
            </Text>
          </Pressable>



        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgrounds.primary,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders.default,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingVertical: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgrounds.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  heroImageContainer: {
    width: 120,
    height: 120,
    borderRadius: Spacing.borderRadius.xl,
    marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  plansContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  planCard: {
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planCardSelected: {
    borderColor: Colors.brand.primary,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  radioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.borders.default,
    marginRight: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: Colors.brand.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.brand.primary,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 2,
  },

  planMainTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.brand.primary,
    marginBottom: 2,
  },
  planSubtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  subscribeSection: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.lg,
  },
  subscribeButton: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    alignItems: 'center',
  },
  subscribeButtonDisabled: {
    opacity: 0.6,
  },
  subscribeText: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  restoreButton: {},
  restoreText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  separator: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },
  footerLinkText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  continueButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.xl,
  },
  continueButtonText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.tertiary,
  },
  featuresContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.lg,
    backgroundColor: Colors.backgrounds.secondary,
    marginHorizontal: Spacing.screenHorizontal,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
  },
  featuresTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  featureBullet: {
    fontSize: Typography.sizes.md,
    color: Colors.brand.primary,
    marginRight: Spacing.sm,
    fontWeight: 'bold',
  },
  featureText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    flex: 1,
  },
  saveBadge: {
    backgroundColor: '#FF4757',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
    alignItems: 'center',
  },
  saveBadgeText: {
    fontSize: Typography.sizes.xs,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});