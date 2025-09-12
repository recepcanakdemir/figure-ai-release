import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Image,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { GeneratedImage } from '@/types';

const { width, height } = Dimensions.get('window');

interface ImagePreviewModalProps {
  visible: boolean;
  image: GeneratedImage | null;
  onClose: () => void;
}

export default function ImagePreviewModal({ 
  visible, 
  image, 
  onClose 
}: ImagePreviewModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const insets = useSafeAreaInsets();

  const requestMediaLibraryPermissions = async () => {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'We need permission to save images to your photo library.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const downloadImage = async () => {
    if (!image || isDownloading) return;

    setIsDownloading(true);
    
    try {
      const hasPermission = await requestMediaLibraryPermissions();
      if (!hasPermission) {
        setIsDownloading(false);
        return;
      }

      // Create a filename for the image
      const timestamp = new Date().getTime();
      const filename = `Figure_AI_${timestamp}.jpg`;
      
      // Download the image to local file system first
      const downloadResult = await FileSystem.downloadAsync(
        image.generatedImageUri,
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

      Alert.alert(
        'Download Successful', 
        'Your figurine has been saved to your photo library in the "Figure AI" album.',
        [{ text: 'OK' }]
      );
      
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed', 
        'Unable to save the image. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const shareImage = async () => {
    if (!image || isSharing) return;

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
        image.generatedImageUri,
        FileSystem.cacheDirectory + filename
      );

      // Share the image
      await Sharing.shareAsync(downloadResult.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Share your Figure AI creation',
        UTI: 'public.jpeg',
      });

    } catch (error: any) {
      console.error('Share error:', error);
      Alert.alert(
        'Share Failed', 
        'Unable to share the image. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSharing(false);
    }
  };

  if (!image) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.9)" />
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <View style={styles.headerContent}>
            <View style={styles.imageInfo}>
              <Text style={styles.imageTitle}>Figure AI Creation</Text>
              <Text style={styles.imageDate}>
                {new Date(image.createdAt).toLocaleDateString()}
              </Text>
            </View>
            
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text.primary} />
            </Pressable>
          </View>
        </View>

        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image.generatedImageUri }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </View>

        {/* Actions */}
        <View style={[styles.actions, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.actionsContent}>
            {/* Model and prompt info */}
            <View style={styles.imageDetails}>
              <Text style={styles.modelText}>{image.aiModel}</Text>
              {image.customPrompt && (
                <Text style={styles.promptText} numberOfLines={2}>
                  &ldquo;{image.customPrompt}&rdquo;
                </Text>
              )}
            </View>

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <Pressable 
                style={[styles.actionButton, styles.downloadButton]}
                onPress={downloadImage}
                disabled={isDownloading}
              >
                <LinearGradient
                  colors={isDownloading ? [Colors.text.tertiary, Colors.text.tertiary] : [Colors.brand.primary, Colors.brand.secondary]}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons 
                    name={isDownloading ? "download-outline" : "download"} 
                    size={20} 
                    color={Colors.text.primary} 
                  />
                  <Text style={styles.actionButtonText}>
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </Text>
                </LinearGradient>
              </Pressable>

              <Pressable 
                style={[styles.actionButton, styles.shareButton]}
                onPress={shareImage}
                disabled={isSharing}
              >
                <View style={styles.actionButtonOutline}>
                  <Ionicons 
                    name={isSharing ? "share-outline" : "share-social"} 
                    size={20} 
                    color={Colors.text.secondary} 
                  />
                  <Text style={styles.actionButtonTextOutline}>
                    {isSharing ? 'Sharing...' : 'Share'}
                  </Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.md,
  },
  imageInfo: {
    flex: 1,
  },
  imageTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  imageDate: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
  },
  previewImage: {
    width: width - (Spacing.screenHorizontal * 2),
    height: height * 0.6,
    borderRadius: Spacing.borderRadius.md,
  },
  actions: {
    backgroundColor: 'transparent',
  },
  actionsContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: Spacing.md,
  },
  imageDetails: {
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  modelText: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.brand.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  promptText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  downloadButton: {},
  shareButton: {},
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    gap: Spacing.sm,
  },
  actionButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borders.default,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: Spacing.sm,
  },
  actionButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  actionButtonTextOutline: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },
});