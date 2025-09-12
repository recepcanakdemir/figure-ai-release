import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { RootState } from '@/store';
import { addGeneratedImage } from '@/store/slices/imagesSlice';
import { GeneratedImage } from '@/types';
import { useServerCredits } from '@/hooks/useServerCredits';

const { width } = Dimensions.get('window');

export default function ResultScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams();
  const user = useSelector((state: RootState) => state.user.user);
  
  // Use server-side credits
  const { credits } = useServerCredits();
  
  // Get parameters from navigation
  const originalImageUri = params.originalImageUri as string;
  const generatedImageUri = params.generatedImageUri as string;
  const prompt = params.prompt as string;
  const customPrompt = params.customPrompt as string;
  const aiModel = params.aiModel as string || 'premium_figurine';
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [savedToGallery, setSavedToGallery] = useState(false);
  const [addedToFavorites, setAddedToFavorites] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const saveToGallery = async () => {
    setIsSaving(true);
    
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('result.permissionRequired'), 
          'We need permission to save images to your photo library.',
          [{ text: 'OK' }]
        );
        setIsSaving(false);
        return;
      }

      // Create a filename for the image
      const timestamp = new Date().getTime();
      const filename = `Figure_AI_${timestamp}.jpg`;
      
      // Download the image to local file system first
      const downloadResult = await FileSystem.downloadAsync(
        generatedImageUri,
        FileSystem.documentDirectory + filename
      );

      // Save to media library
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
      
      // Create or get the Figure AI album
      let album = await MediaLibrary.getAlbumAsync('Figure AI');
      if (album == null) {
        album = await MediaLibrary.createAlbumAsync('Figure AI', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      setSavedToGallery(true);
      Alert.alert(
        t('common.success'), 
        'Your figurine has been saved to your photo library in the "Figure AI" album.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('result.saveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const shareImage = async () => {
    setIsSharing(true);
    
    try {
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Sharing Unavailable', 'Sharing is not available on this device.');
        setIsSharing(false);
        return;
      }

      // Create a filename for the image
      const timestamp = new Date().getTime();
      const filename = `Figure_AI_${timestamp}.jpg`;
      
      // Download the image to local file system first
      const downloadResult = await FileSystem.downloadAsync(
        generatedImageUri,
        FileSystem.cacheDirectory + filename
      );

      // Share the image
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share your Figure AI creation',
        UTI: 'public.jpeg',
      });

    } catch (error) {
      Alert.alert(t('common.error'), t('result.shareError'));
    } finally {
      setIsSharing(false);
    }
  };

  const addToFavorites = () => {
    const generatedImage: GeneratedImage = {
      id: Date.now().toString(),
      originalImageUri,
      generatedImageUri,
      prompt,
      customPrompt,
      aiModel,
      createdAt: new Date().toISOString(),
      isFavorite: true,
      creditsUsed: 1,
    };

    dispatch(addGeneratedImage(generatedImage));
    setAddedToFavorites(true);
    Alert.alert(t('result.addedToFavorites'), t('result.favoriteAdded'));
  };

  const createAnother = () => {
    router.back();
  };

  const goToFavorites = () => {
    router.push('/(tabs)/favorites');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('result.title')}</Text>
          <Text style={styles.subtitle}>{t('result.subtitle')}</Text>
        </View>

        {/* Main Generated Image - Prominent Display */}
        <View style={styles.mainImageContainer}>
          <View style={styles.imageWrapper}>
            {!imageLoaded && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color={Colors.brand.primary} />
                <Text style={styles.imageLoadingText}>Loading your figurine...</Text>
              </View>
            )}
            <Image 
              source={{ uri: generatedImageUri }} 
              style={[styles.mainImage, !imageLoaded && styles.hiddenImage]}
              resizeMode="contain"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
            />
            {imageLoaded && (
              <View style={styles.imageOverlay}>
                <Text style={styles.mainImageLabel}>{t('result.aiFigurine')}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Original Image Reference */}
        <View style={styles.originalImageSection}>
          <Text style={styles.originalLabel}>{t('result.transformedFrom')}</Text>
          <View style={styles.originalImageContainer}>
            <Image source={{ uri: originalImageUri }} style={styles.originalImage} />
          </View>
        </View>

        {/* Primary Action Buttons */}
        <View style={styles.primaryActionsContainer}>
          <Pressable
            style={styles.primaryActionButton}
            onPress={saveToGallery}
            disabled={isSaving || savedToGallery}
          >
            <LinearGradient
              colors={savedToGallery || isSaving ? [Colors.text.tertiary, Colors.text.tertiary] : [Colors.brand.primary, Colors.brand.secondary]}
              style={styles.primaryActionGradient}
            >
              <Ionicons 
                name={savedToGallery ? "checkmark-circle" : isSaving ? "download-outline" : "download"} 
                size={20} 
                color={Colors.text.primary} 
              />
              <Text style={styles.primaryActionText}>
                {savedToGallery ? t('result.saved') : isSaving ? t('result.saving') : t('result.save')}
              </Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={styles.primaryActionButton}
            onPress={shareImage}
            disabled={isSharing}
          >
            <View style={styles.primaryActionOutline}>
              <Ionicons 
                name={isSharing ? "share-outline" : "share-social"} 
                size={20} 
                color={isSharing ? Colors.text.tertiary : Colors.text.secondary} 
              />
              <Text style={[styles.primaryActionOutlineText, isSharing && styles.disabledText]}>
                {isSharing ? t('result.sharing') : t('result.share')}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={styles.favoritesIconButton}
            onPress={addToFavorites}
            disabled={addedToFavorites}
            accessibilityLabel={addedToFavorites ? t('result.addedToFavorites') : t('result.addToFavorites')}
          >
            <View style={[styles.favoritesIconContainer, addedToFavorites && styles.favoritesIconActive]}>
              <Ionicons 
                name={addedToFavorites ? "heart" : "heart-outline"} 
                size={24} 
                color={addedToFavorites ? Colors.text.primary : Colors.text.secondary} 
              />
            </View>
          </Pressable>
        </View>

        {/* Image Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>{t('result.detailsTitle')}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('result.style')}:</Text>
            <Text style={styles.detailValue}>{aiModel.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
          </View>
          {customPrompt && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('result.customDetails')}:</Text>
              <Text style={styles.detailValue}>{customPrompt}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>{t('result.created')}:</Text>
            <Text style={styles.detailValue}>{new Date().toLocaleString()}</Text>
          </View>
        </View>

        {/* Navigation Actions */}
        <View style={styles.navigationActionsContainer}>
          <Pressable
            style={[styles.navigationButton, styles.createAnotherButton]}
            onPress={createAnother}
          >
            <View style={styles.buttonContent}>
              <Ionicons 
                name="add-circle-outline" 
                size={20} 
                color={Colors.brand.primary} 
              />
              <Text style={styles.createAnotherText}>{t('result.createAnother')}</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.navigationButton, styles.viewFavoritesButton]}
            onPress={goToFavorites}
          >
            <View style={styles.buttonContent}>
              <Ionicons 
                name="heart-outline" 
                size={18} 
                color={Colors.text.secondary} 
              />
              <Text style={styles.viewFavoritesText}>{t('result.viewFavorites')}</Text>
            </View>
          </Pressable>
        </View>

        {/* Credits Used */}
        <View style={styles.creditsContainer}>
          <View style={styles.creditsRow}>
            <Ionicons name="flash" size={16} color={Colors.brand.primary} />
            <Text style={styles.creditsText}>
              1 {t('result.creditUsed')} • {credits} {t('result.creditsRemaining')}
            </Text>
          </View>
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
  scrollContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Main image display styles
  mainImageContainer: {
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: Spacing.borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: Colors.backgrounds.secondary,
    borderWidth: 1,
    borderColor: Colors.borders.focus,
    elevation: 8,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mainImage: {
    width: width * 0.85,
    height: width * 0.85,
  },
  hiddenImage: {
    opacity: 0,
  },
  imageLoadingContainer: {
    position: 'absolute',
    width: width * 0.85,
    height: width * 0.85,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: Spacing.borderRadius.xl,
    zIndex: 1,
  },
  imageLoadingText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  mainImageLabel: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
  },
  // Original image reference styles
  originalImageSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  originalLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    fontWeight: '600',
  },
  originalImageContainer: {
    borderRadius: Spacing.borderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.backgrounds.secondary,
    borderWidth: 1,
    borderColor: Colors.borders.default,
  },
  originalImage: {
    width: width * 0.3,
    height: width * 0.3,
  },
  // Primary actions styles
  primaryActionsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  primaryActionButton: {
    flex: 1,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    gap: Spacing.sm,
  },
  primaryActionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borders.default,
    backgroundColor: Colors.backgrounds.secondary,
    gap: Spacing.sm,
  },
  primaryActionText: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  primaryActionOutlineText: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },
  disabledText: {
    color: Colors.text.tertiary,
  },
  favoritesActiveText: {
    color: Colors.brand.primary,
  },
  // Favorites icon button styles
  favoritesIconButton: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritesIconContainer: {
    width: 56,
    height: 48,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borders.default,
    backgroundColor: Colors.backgrounds.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoritesIconActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + '20',
  },
  // Details section styles
  detailsContainer: {
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borders.default,
  },
  detailsTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    width: 100,
    fontWeight: '600',
  },
  detailValue: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    flex: 1,
  },
  // Navigation actions styles
  navigationActionsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  navigationButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    alignItems: 'center',
  },
  createAnotherButton: {
    backgroundColor: Colors.backgrounds.secondary,
    borderWidth: 1,
    borderColor: Colors.brand.primary,
  },
  createAnotherText: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.brand.primary,
  },
  viewFavoritesButton: {
    backgroundColor: 'transparent',
  },
  viewFavoritesText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textDecorationLine: 'underline',
  },
  // Credits and utility styles
  creditsContainer: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.borders.default,
  },
  creditsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditsText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.tertiary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});