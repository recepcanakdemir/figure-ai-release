import { changeLanguage, getCurrentLanguage, supportedLanguages } from '@/services/i18n';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';

import { Colors } from '@/constants/Colors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useRevenueCat } from '@/hooks/useRevenueCat';
import { useServerCredits } from '@/hooks/useServerCredits';
import { RootState } from '@/store';
import { resetUserData } from '@/store/slices/userSlice';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const subscriptionProducts = useSelector((state: RootState) => state.user.subscriptionProducts);
  const { restorePurchases } = useRevenueCat();
  
  // Use server-side credits
  const { credits, subscriptionStatus } = useServerCredits();
  
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState(getCurrentLanguage());
  const [isRestoringPurchases, setIsRestoringPurchases] = useState(false);

  const currentPlan = subscriptionProducts.find(p => p.type === user?.subscriptionType);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleRestorePurchases = async () => {
    try {
      setIsRestoringPurchases(true);
      const hasActiveSubscription = await restorePurchases();
      
      if (hasActiveSubscription) {
        Alert.alert(
          t('settings.restoreSuccessTitle'),
          t('settings.restoreSuccessMessage'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('settings.restoreNoSubscriptionsTitle'),
          t('settings.restoreNoSubscriptionsMessage'),
          [{ text: t('common.ok') }]
        );
      }
    } catch (error: any) {
      console.error('Restore failed:', error);
      Alert.alert(
        t('common.error'),
        error.message || t('settings.restoreFailed'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsRestoringPurchases(false);
    }
  };

  const handleChangeSubscription = () => {
    router.push('/paywall');
  };

  const handlePrivacyPolicy = () => {
    // TODO: Replace with actual Privacy Policy URL
    const privacyPolicyUrl = 'https://www.freeprivacypolicy.com/live/92c38279-c2fd-4006-a61e-59dd6ee684ab';
    
    Linking.canOpenURL(privacyPolicyUrl).then((supported) => {
      if (supported) {
        Linking.openURL(privacyPolicyUrl);
      } else {
        Alert.alert(
          t('settings.privacyPolicy'),
          `URL: ${privacyPolicyUrl}\n\n${t('settings.urlNotSupported')}`,
          [{ text: t('common.ok') }]
        );
      }
    });
  };

  const handleTermsOfService = () => {
    // TODO: Replace with actual Terms of Service URL
    const termsUrl = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';
    
    Linking.canOpenURL(termsUrl).then((supported) => {
      if (supported) {
        Linking.openURL(termsUrl);
      } else {
        Alert.alert(
          t('settings.termsOfService'),
          `URL: ${termsUrl}\n\n${t('settings.urlNotSupported')}`,
          [{ text: t('common.ok') }]
        );
      }
    });
  };

  const handleSupport = () => {
    const email = 'landmarkaiguide@gmail.com';
    const subject = t('settings.supportSubject');
    const body = t('settings.supportBody')
      .replace('{userId}', user?.id || '')
      .replace('{subscription}', user?.subscriptionStatus || '')
      .replace('{credits}', credits?.toString() || '0');
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.canOpenURL(mailtoUrl).then((supported) => {
      if (supported) {
        Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Email Not Available',
          t('settings.emailNotAvailable').replace('{email}', email),
          [{ text: t('common.ok') }]
        );
      }
    });
  };

  const handleLanguageSelect = async (languageCode: string) => {
    await changeLanguage(languageCode);
    setCurrentLanguage(languageCode);
    setIsLanguageModalVisible(false);
  };

  const handleResetData = () => {
    Alert.alert(
      t('settings.resetData'),
      t('settings.resetConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            dispatch(resetUserData());
            Alert.alert(t('settings.resetData'), t('settings.dataReset'));
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('settings.title')}</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.userInfoCard}>
          <LinearGradient
            colors={[Colors.brand.primary + '10', Colors.brand.accent + '10']}
            style={styles.userInfoGradient}
          >
            <View style={styles.userInfoHeader}>
              <View style={styles.userInfoLeft}>
                <Text style={styles.userName}>{t('settings.userInfo')}</Text>
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: user?.subscriptionStatus === 'active' ? '#4CAF50' : '#FF9800' }
                  ]} />
                  <Text style={styles.statusText}>
                    {user?.subscriptionStatus === 'active' ? t('settings.proMember') : t('settings.freeUser')}
                  </Text>
                </View>
              </View>
            </View>

            {user?.subscriptionStatus === 'active' && currentPlan && (
              <View style={styles.subscriptionInfo}>
                <View style={styles.subscriptionDetail}>
                  <Text style={styles.subscriptionLabel}>{t('settings.currentPlan')}</Text>
                  <Text style={styles.subscriptionValue}>{currentPlan.title}</Text>
                </View>
                <View style={styles.subscriptionDetail}>
                  <Text style={styles.subscriptionLabel}>{t('settings.creditsRenew')}</Text>
                  <Text style={styles.subscriptionValue}>
                    {user.weeklyCreditsResetDate ? formatDate(user.weeklyCreditsResetDate) : 'N/A'}
                  </Text>
                </View>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t('settings.subscription')}</Text>
          
          <Pressable 
            style={[styles.settingItem, isRestoringPurchases && styles.settingItemDisabled]} 
            onPress={handleRestorePurchases}
            disabled={isRestoringPurchases}
          >
            <View style={styles.settingLeft}>
              <Ionicons 
                name={isRestoringPurchases ? "hourglass" : "refresh"} 
                size={20} 
                color={isRestoringPurchases ? Colors.text.tertiary : Colors.brand.primary} 
              />
              <Text style={[styles.settingText, isRestoringPurchases && styles.settingTextDisabled]}>
                {isRestoringPurchases ? t('settings.restoring') : t('settings.restorePurchases')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
          </Pressable>

          <Pressable style={styles.settingItem} onPress={handleChangeSubscription}>
            <View style={styles.settingLeft}>
              <Ionicons name="card" size={20} color={Colors.brand.primary} />
              <Text style={styles.settingText}>
                {user?.subscriptionStatus === 'active' ? t('settings.manageSubscription') : t('settings.upgradeToPro')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
          </Pressable>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t('settings.legalSupport')}</Text>
          
          <Pressable style={styles.settingItem} onPress={handlePrivacyPolicy}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.brand.primary} />
              <Text style={styles.settingText}>{t('settings.privacyPolicy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
          </Pressable>

          <Pressable style={styles.settingItem} onPress={handleTermsOfService}>
            <View style={styles.settingLeft}>
              <Ionicons name="document-text" size={20} color={Colors.brand.primary} />
              <Text style={styles.settingText}>{t('settings.termsOfService')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
          </Pressable>

          <Pressable style={styles.settingItem} onPress={handleSupport}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail" size={20} color={Colors.brand.primary} />
              <Text style={styles.settingText}>{t('settings.support')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
          </Pressable>
        </View>

        {/* Language Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          
          <Pressable style={styles.settingItem} onPress={() => setIsLanguageModalVisible(true)}>
            <View style={styles.settingLeft}>
              <Ionicons name="language" size={20} color={Colors.brand.primary} />
              <Text style={styles.settingText}>{t('settings.selectLanguage')}</Text>
            </View>
            <View style={styles.languageInfo}>
              <Text style={styles.currentLanguageText}>
                {supportedLanguages.find(lang => lang.code === currentLanguage)?.nativeName}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={Colors.text.tertiary} />
            </View>
          </Pressable>
        </View>

  

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>{t('settings.version')}</Text>
          <Text style={styles.versionSubtext}>{t('settings.madeWith')}</Text>
        </View>

        {/* Bottom padding for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal
        visible={isLanguageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.selectLanguage')}</Text>
              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setIsLanguageModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </Pressable>
            </View>
            
            <ScrollView 
              style={styles.languageList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Spacing.lg }}
            >
              {supportedLanguages.map((language) => (
                <Pressable
                  key={language.code}
                  style={[
                    styles.languageItem,
                    currentLanguage === language.code && styles.languageItemSelected
                  ]}
                  onPress={() => handleLanguageSelect(language.code)}
                >
                  <View style={styles.languageInfo}>
                    <Text style={styles.languageName}>{language.nativeName}</Text>
                    <Text style={styles.languageNameEn}>{language.name}</Text>
                  </View>
                  {currentLanguage === language.code && (
                    <Ionicons name="checkmark" size={20} color={Colors.brand.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgrounds.primary,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  userInfoCard: {
    marginHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.xl,
    borderRadius: Spacing.borderRadius.lg,
    overflow: 'hidden',
  },
  userInfoGradient: {
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borders.default,
  },
  userInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  userInfoLeft: {
    flex: 1,
  },
  userName: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  statusText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  creditsDisplay: {
    alignItems: 'center',
    backgroundColor: Colors.backgrounds.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
  },
  creditsValue: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  creditsLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
  },
  subscriptionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borders.default,
  },
  subscriptionDetail: {
    flex: 1,
  },
  subscriptionLabel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  subscriptionValue: {
    fontSize: Typography.sizes.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  settingsSection: {
    marginHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.backgrounds.secondary,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borders.default,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    marginLeft: Spacing.md,
    fontWeight: '500',
  },
  settingItemDisabled: {
    opacity: 0.6,
  },
  settingTextDisabled: {
    color: Colors.text.tertiary,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginHorizontal: Spacing.screenHorizontal,
  },
  versionText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
    marginBottom: Spacing.xs,
  },
  versionSubtext: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },
  bottomPadding: {
    height: 100,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentLanguageText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.backgrounds.primary,
    borderRadius: Spacing.borderRadius.xl,
    width: '100%',
    maxHeight: '80%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: Colors.borders.default,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders.default,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgrounds.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageList: {
    maxHeight: 400,
  },
  languageItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borders.default,
  },
  languageItemSelected: {
    backgroundColor: Colors.brand.primary + '10',
  },
  languageName: {
    fontSize: Typography.sizes.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  languageNameEn: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
});