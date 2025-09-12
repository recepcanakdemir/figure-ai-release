/**
 * Figure AI - Credit Status Card
 * Displays current credit status, subscription info, and pending changes
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { useServerCredits } from '@/hooks/useServerCredits';

interface CreditStatusCardProps {
  onPress?: () => void;
  showSubscriptionDetails?: boolean;
}

export default function CreditStatusCard({ 
  onPress, 
  showSubscriptionDetails = true 
}: CreditStatusCardProps) {
  const { t } = useTranslation();
  
  const {
    credits,
    subscriptionStatus,
    subscriptionType,
    isLoading,
    error,
    periodEnd,
    pendingChange,
    hasActivePendingDowngrade,
    refreshCredits,
    checkCreditReset
  } = useServerCredits();

  const handlePress = onPress || (async () => {
    await refreshCredits();
    await checkCreditReset();
  });

  // Auto-refresh credits every 30 seconds when component is mounted
  useEffect(() => {
    if (!isLoading && !error) {
      const interval = setInterval(() => {
        console.log('🔄 CreditStatusCard auto-refresh');
        refreshCredits();
        checkCreditReset();
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [refreshCredits, checkCreditReset, isLoading, error]);

  const getSubscriptionStatusText = () => {
    if (subscriptionStatus === 'active') {
      if (subscriptionType === 'weekly') return t('subscription.weeklyActive');
      if (subscriptionType === 'monthly') return t('subscription.monthlyActive');
      return t('subscription.active');
    }
    return t('subscription.free');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      {/* Main Credit Display */}
      <View style={styles.creditSection}>
        <View style={styles.creditDisplay}>
          <Ionicons 
            name="flash" 
            size={24} 
            color={credits > 0 ? Colors.brand.primary : Colors.text.tertiary} 
          />
          <Text style={styles.creditValue}>
            {isLoading ? '...' : credits}
          </Text>
          <Text style={styles.creditLabel}>
            {t('credits.credits')}
          </Text>
        </View>

        {/* Status Indicators */}
        <View style={styles.indicators}>
          {isLoading && (
            <Ionicons name="sync" size={16} color={Colors.brand.primary} />
          )}
          
          {hasActivePendingDowngrade && (
            <View style={styles.warningIndicator}>
              <Ionicons name="arrow-down-circle" size={16} color={Colors.brand.highlight} />
            </View>
          )}
          
          {error && (
            <Ionicons name="alert-circle" size={16} color={Colors.brand.highlight} />
          )}
        </View>
      </View>

      {/* Subscription Details */}
      {showSubscriptionDetails && (
        <View style={styles.subscriptionSection}>
          <View style={styles.subscriptionRow}>
            <Text style={styles.subscriptionStatus}>
              {getSubscriptionStatusText()}
            </Text>
            
            {subscriptionStatus === 'active' && periodEnd && (
              <Text style={styles.periodEnd}>
                {t('subscription.renewsOn', { date: formatDate(periodEnd) })}
              </Text>
            )}
          </View>

          {/* Pending Change Warning */}
          {hasActivePendingDowngrade && pendingChange && (
            <View style={styles.pendingChangeWarning}>
              <Ionicons name="time" size={14} color={Colors.brand.highlight} />
              <Text style={styles.pendingChangeText}>
                {t('subscription.pendingDowngrade', {
                  from: pendingChange.from,
                  to: pendingChange.to,
                  date: formatDate(pendingChange.effective_date)
                })}
              </Text>
            </View>
          )}

          {/* No Credits Warning */}
          {credits === 0 && subscriptionStatus === 'free' && (
            <Pressable 
              style={styles.upgradeButton}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.upgradeButtonText}>
                {t('subscription.upgrade')}
              </Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.brand.primary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorSection}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.borders.default,
  },
  creditSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  creditDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creditValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text.primary,
    marginLeft: 8,
    marginRight: 4,
  },
  creditLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textTransform: 'lowercase',
  },
  indicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warningIndicator: {
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: 12,
    padding: 4,
  },
  subscriptionSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borders.default,
    paddingTop: 12,
    gap: 8,
  },
  subscriptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subscriptionStatus: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text.primary,
  },
  periodEnd: {
    fontSize: 12,
    color: Colors.text.tertiary,
  },
  pendingChangeWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgrounds.secondary,
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  pendingChangeText: {
    flex: 1,
    fontSize: 12,
    color: Colors.brand.highlight,
    lineHeight: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.backgrounds.secondary,
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.brand.primary,
  },
  errorSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.borders.default,
    paddingTop: 8,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.brand.highlight,
    textAlign: 'center',
  },
});