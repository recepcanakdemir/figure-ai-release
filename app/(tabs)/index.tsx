import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Pressable, 
  ImageBackground, 
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { useTranslation } from 'react-i18next';
import { RootState } from '@/store';
import { GeneratedImage } from '@/types';
import ImagePreviewModal from '@/components/shared/ImagePreviewModal';
import { useServerCredits } from '@/hooks/useServerCredits';

const { width } = Dimensions.get('window');

// Example figurine creation results for showcase
const exampleResults = [
  {
    id: '1',
    title: 'Premium Figurine',
    before: require('../../assets/images/samples/before.jpg'),
    after: require('../../assets/images/samples/after.jpg'),
    prompt: '1/7 scale premium collectible with packaging',
  },
  {
    id: '2', 
    title: 'Anime Style Figurine',
    before: require('../../assets/images/samples/emre-b.jpeg'),
    after: require('../../assets/images/samples/emre-a.png'),
    prompt: 'Anime-inspired figurine on computer desk',
  },
  {
    id: '3',
    title: 'Realistic Figurine',
    before: require('../../assets/images/samples/dog1.png'),
    after: require('../../assets/images/samples/dogs.png'),
    prompt: 'Life-like figurine with realistic details',
  },
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const user = useSelector((state: RootState) => state.user.user);
  const favorites = useSelector((state: RootState) => state.images.favorites);
  
  // Use server-side credits instead of Redux state
  const { 
    credits, 
    subscriptionStatus,
    subscriptionType,
    isLoading: creditsLoading,
    error: creditsError,
    periodEnd,
    pendingChange,
    refreshCredits,
    checkCreditReset,
    hasActivePendingDowngrade
  } = useServerCredits();
  
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const openPreview = (image: GeneratedImage) => {
    setPreviewImage(image);
    setIsPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setIsPreviewVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.titleText}>{t('home.title')}</Text>
          
          <View style={styles.headerRight}>

            
            {/* Pro Button */}
            {subscriptionStatus !== 'active' && (
              <Pressable 
                style={styles.proButton}
                onPress={() => router.push('/paywall')}
              >
                <Text style={styles.proButtonText}>{t('home.proButton')}</Text>
              </Pressable>
            )}
            {/* Credits Display - Now from server */}
            <Pressable 
              style={styles.creditsContainer} 
              onPress={async () => {
                await refreshCredits()
                await checkCreditReset()
              }}
            >
              <Ionicons name="flash" size={18} color={Colors.brand.primary} />
              <Text style={styles.creditsValue}>
                {creditsLoading ? '...' : credits}
              </Text>
              {creditsLoading && (
                <ActivityIndicator size="small" color={Colors.brand.primary} style={{ marginLeft: 4 }} />
              )}
              {/* Show pending downgrade indicator */}
              {hasActivePendingDowngrade && (
                <Ionicons 
                  name="arrow-down-circle" 
                  size={14} 
                  color={Colors.text.tertiary} 
                  style={{ marginLeft: 2 }} 
                />
              )}
            </Pressable>
            {creditsError && (
              <Text style={styles.errorText}>!</Text>
            )}
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>{t('home.heroTitle')}</Text>
          <Text style={styles.heroSubtitle}>
            {t('home.heroSubtitle')}
          </Text>
          
          <Pressable 
            style={styles.createButton}
            onPress={() => router.push('/(tabs)/camera')}
          >
            <LinearGradient
              colors={Colors.gradients.primary as any}
              style={styles.createButtonGradient}
            >
              <Text style={styles.createButtonText}>{t('home.createButton')}</Text>
            </LinearGradient>
          </Pressable>
        </View>

        {/* Examples Showcase */}
        <View style={styles.examplesSection}>
          <Text style={styles.sectionTitle}>{t('home.examplesTitle')}</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.examplesContainer}
          >
            {exampleResults.map((example, index) => (
              <View key={example.id} style={styles.exampleCard}>
                <View style={styles.beforeAfterContainer}>
                  <View style={styles.imageContainer}>
                    <ImageBackground
                      source={example.before}
                      style={styles.exampleImage}
                    >
                      <View style={styles.imageOverlay}>
                        <Text style={styles.imageLabel}>Before</Text>
                      </View>
                    </ImageBackground>
                  </View>
                  
                  <View style={styles.arrowContainer}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                  
                  <View style={styles.imageContainer}>
                    <ImageBackground
                      source={ example.after }
                      style={styles.exampleImage}
                    >
                      <View style={styles.imageOverlay}>
                        <Text style={styles.imageLabel}>After</Text>
                      </View>
                    </ImageBackground>
                  </View>
                </View>
                
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Recent Favorites */}
        {favorites.length > 0 && (
          <View style={styles.favoritesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t('home.favoritesTitle')}</Text>
              <Pressable onPress={() => router.push('/(tabs)/favorites')}>
                <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
              </Pressable>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.favoritesContainer}
            >
              {favorites.slice(0, 5).map((favorite) => (
                <Pressable
                  key={favorite.id}
                  style={styles.favoriteCard}
                  onPress={() => openPreview(favorite)}
                >
                  <ImageBackground
                    source={{ uri: favorite.generatedImageUri }}
                    style={styles.favoriteImage}
                  />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom padding for tab bar */}
        <View style={styles.bottomPadding} />
      </ScrollView>
      
      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={isPreviewVisible}
        image={previewImage}
        onClose={closePreview}
      />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  proButton: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
  },
  proButtonText: {
    fontSize: Typography.sizes.sm,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: 0.5,
  },
  titleText: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: '800',
    color: Colors.text.primary,
    letterSpacing: -0.5,
  },
  creditsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.backgrounds.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.full,
    gap: 4,
  },
  creditsValue: {
    fontSize: Typography.sizes.md,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  heroSection: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: Typography.sizes.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  createButton: {
    width: '100%',
    maxWidth: 280,
  },
  createButtonGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.borderRadius.lg,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  examplesSection: {
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.md,
  },
  examplesContainer: {
    paddingLeft: Spacing.screenHorizontal,
    paddingRight: Spacing.sm,
  },
  exampleCard: {
    width: width * 0.9,
    marginRight: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borders.default,
  },
  beforeAfterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  imageContainer: {
    flex: 1,
  },
  exampleImage: {
    width: '100%',
    height: 120,
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  imageOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: Spacing.xs,
    alignItems: 'center',
  },
  imageLabel: {
    color: Colors.text.primary,
    fontSize: Typography.sizes.xs,
    fontWeight: 'bold',
  },
  arrowContainer: {
    paddingHorizontal: Spacing.sm,
  },
  arrowText: {
    fontSize: Typography.sizes.xl,
    color: Colors.brand.accent,
  },
  exampleTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  examplePrompt: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
  },
  favoritesSection: {
    paddingBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.md,
  },
  seeAllText: {
    fontSize: Typography.sizes.md,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  favoritesContainer: {
    paddingLeft: Spacing.screenHorizontal,
    paddingRight: Spacing.sm,
  },
  favoriteCard: {
    marginRight: Spacing.sm,
  },
  favoriteImage: {
    width: 100,
    height: 100,
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
  },
  bottomPadding: {
    height: 100, // Space for tab bar
  },
  errorText: {
    fontSize: Typography.sizes.sm,
    color: '#FF4757',
    fontWeight: 'bold',
  },
});
