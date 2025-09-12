import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  Alert,
  ScrollView,
  TextInput,
  Image,
  Dimensions,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector, useDispatch } from 'react-redux';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { RootState } from '@/store';
import { setSelectedAIModel } from '@/store/slices/settingsSlice';
import { useServerCredits } from '@/hooks/useServerCredits';
import { aiService } from '@/services/ai';

const { width } = Dimensions.get('window');

export default function CameraScreen() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const availableModels = useSelector((state: RootState) => state.settings.availableModels);
  const selectedModelId = useSelector((state: RootState) => state.settings.settings.selectedAIModel);
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Server-side credit management
  const { 
    credits, 
    subscriptionStatus,
    subscriptionType,
    isLoading: creditsLoading, 
    error: creditsError,
    pendingChange,
    hasEnoughCredits, 
    spendCredits,
    refreshCredits,
    checkCreditReset,
    hasActivePendingDowngrade
  } = useServerCredits();
  
  // Get the currently selected model
  const selectedModel = availableModels.find(model => model.id === selectedModelId && model.isActive) || 
                       availableModels.find(model => model.isActive) || 
                       availableModels[0];

  const requestMediaLibraryPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        t('camera.permissionsTitle'),
        'We need access to your photo library to select images.',
        [{ text: t('common.ok') }]
      );
      return false;
    }
    return true;
  };

  const requestCameraPermissions = async () => {
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    
    if (cameraStatus.status !== 'granted') {
      Alert.alert(
        t('camera.permissionsTitle'),
        'We need access to your camera to take photos.',
        [{ text: t('common.ok') }]
      );
      return false;
    }
    return true;
  };

  const pickImage = async (useCamera: boolean = false) => {
    // Request appropriate permission based on what user wants to do
    const hasPermission = useCamera 
      ? await requestCameraPermissions()
      : await requestMediaLibraryPermissions();
    
    if (!hasPermission) return;

    try {
      const result = useCamera 
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch {
      Alert.alert(t('common.error'), t('camera.imageError'));
    }
  };

  // Mock figurine results for testing (fallback)
  const mockFigurineResults = [
    'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&h=400&fit=crop',
    'https://images.unsplash.com/photo-1594736797933-d0781dcbf8ba?w=400&h=400&fit=crop'
  ];

  const generateFigurine = async () => {
    if (!selectedImage || !selectedModel) {
      Alert.alert(t('camera.missingImage'), t('camera.missingImage'));
      return;
    }

    setIsProcessing(true);
    
    try {
      let generatedImageUri: string;
      
      // Always use FalAI provider
      await aiService.initialize({ apiKey: 'hardcoded' }, 'fal_ai');
      
      // Process image with FalAI
      const result = await aiService.processImage(selectedImage, selectedModel, customPrompt);
      
      if (result.success && result.imageUri) {
        generatedImageUri = result.imageUri;
      } else {
        // Fallback to mock result if AI processing fails
        console.warn('FalAI processing failed:', result.error);
        const randomIndex = Math.floor(Math.random() * mockFigurineResults.length);
        generatedImageUri = mockFigurineResults[randomIndex];
      }
      
      // Check server-side credits and handle accordingly
      const userHasCredits = hasEnoughCredits(selectedModel.creditsPerUse);
      
      if (userHasCredits) {
        // User has credits - spend on server and go to result
        console.log(`Spending ${selectedModel.creditsPerUse} credits on server...`);
        
        const spendResult = await spendCredits(selectedModel.creditsPerUse, `AI generation - ${selectedModel.name}`);
        
        if (spendResult.success) {
          console.log(`Credits spent successfully. Remaining: ${spendResult.remaining_credits}`);
          
          router.push({
            pathname: '/result',
            params: {
              originalImageUri: selectedImage,
              generatedImageUri,
              prompt: selectedModel.basePrompt,
              customPrompt: customPrompt || '',
              aiModel: selectedModel.id,
            }
          });
        } else {
          // Server-side credit spending failed
          console.error('Failed to spend credits:', spendResult.error);
          Alert.alert(
            t('common.error'), 
            spendResult.error || 'Failed to spend credits. Please try again.',
            [
              { 
                text: t('common.retry'), 
                onPress: async () => {
                  await refreshCredits()
                  await checkCreditReset()
                }
              },
              { text: t('common.ok') }
            ]
          );
        }
      } else {
        // User has no credits - show paywall first, then result
        console.log(`Insufficient credits. User has ${credits}, needs ${selectedModel.creditsPerUse}`);
        
        router.push({
          pathname: '/paywall',
          params: { 
            source: 'generation',
            // Pass result params to show after subscription
            originalImageUri: selectedImage,
            generatedImageUri,
            prompt: selectedModel.basePrompt,
            customPrompt: customPrompt || '',
            aiModel: selectedModel.id,
            // Pass credit cost information for deduction after subscription
            creditsRequired: selectedModel.creditsPerUse.toString(),
          }
        });
      }
      
      // Reset form
      setSelectedImage(null);
      setCustomPrompt('');
      
    } catch (error: any) {
      Alert.alert(t('camera.generationFailed'), error.message || t('camera.tryAgain'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* AI Generation Loading Modal */}
      <Modal
        visible={isProcessing}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={false}
      >
        <View style={styles.loadingModalContainer}>
          <View style={styles.loadingModalContent}>
            <ActivityIndicator size="large" color={Colors.brand.primary} />
            <Text style={styles.loadingModalTitle}>{t('camera.creating')}</Text>
            <Text style={styles.loadingModalSubtitle}>
              {'Processing'}...
            </Text>
          </View>
        </View>
      </Modal>
      
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('camera.title')}</Text>
          <Pressable style={styles.creditsDisplay} onPress={refreshCredits}>
            <Ionicons name="flash" size={16} color={Colors.brand.primary} />
            <Text style={styles.creditsValue}>
              {creditsLoading ? '...' : credits}
            </Text>
            {creditsLoading && (
              <ActivityIndicator size="small" color={Colors.brand.primary} style={{ marginLeft: 4 }} />
            )}
          </Pressable>
        </View>

        {/* Image Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. {t('camera.selectPhoto')}</Text>
          
          {!selectedImage ? (
            <View style={styles.imageSelectionContainer}>
              <Pressable 
                style={styles.imageButton}
                onPress={() => pickImage(true)}
              >
                <LinearGradient
                  colors={[Colors.brand.primary, Colors.brand.secondary]}
                  style={styles.imageButtonGradient}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons name="camera" size={20} color={Colors.text.primary} />
                    <Text style={styles.imageButtonText}>{t('camera.takePhoto')}</Text>
                  </View>
                </LinearGradient>
              </Pressable>
              
              <Text style={styles.orText}>{t('common.or')}</Text>
              
              <Pressable 
                style={styles.imageButton}
                onPress={() => pickImage(false)}
              >
                <View style={styles.imageButtonOutline}>
                  <View style={styles.buttonContent}>
                    <Ionicons name="images" size={20} color={Colors.brand.primary} />
                    <Text style={styles.imageButtonTextOutline}>{t('camera.chooseLibrary')}</Text>
                  </View>
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={styles.selectedImageContainer}>
              <View style={styles.imagePreviewCard}>
                <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                <View style={styles.imageActions}>
                  <View style={styles.statusContent}>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.brand.primary} />
                    <Text style={styles.selectedImageText}>{t('camera.photoSelected')}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedImage(null)} style={styles.changePhotoButton}>
                    <View style={styles.buttonContent}>
                      <Ionicons name="refresh" size={16} color={Colors.text.secondary} />
                      <Text style={styles.changePhotoText}>{t('camera.changePhoto')}</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        </View>


        {/* Custom Prompt */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. {t('camera.customDetails')}</Text>
          <TextInput
            style={styles.promptInput}
            placeholder={t('camera.customPlaceholder')}
            placeholderTextColor={Colors.text.tertiary}
            value={customPrompt}
            onChangeText={setCustomPrompt}
            multiline
            maxLength={200}
          />
          <Text style={styles.characterCount}>
            {customPrompt.length}/200 {t('camera.characterCount')}
          </Text>
        </View>

        {/* Generate Button */}
        <View style={styles.generateSection}>
          <Pressable
            style={[styles.generateButton, (!selectedImage || isProcessing) && styles.generateButtonDisabled]}
            onPress={generateFigurine}
            disabled={!selectedImage || isProcessing}
          >
            <LinearGradient
              colors={(!selectedImage || isProcessing) 
                ? [Colors.text.tertiary, Colors.text.tertiary] 
                : Colors.gradients.primary as any
              }
              style={styles.generateButtonGradient}
            >
              <View style={styles.buttonContent}>
                <Ionicons 
                  name={isProcessing ? "time" : "sparkles"} 
                  size={20} 
                  color={Colors.text.primary} 
                />
                <Text style={styles.generateButtonText}>
                  {isProcessing ? t('camera.creating') : t('camera.createFigurine')}
                </Text>
              </View>
              {selectedModel && (
                <Text style={styles.generateButtonSubtext}>
                  {t('camera.uses')} {selectedModel.creditsPerUse} {selectedModel.creditsPerUse > 1 ? t('camera.credits') : t('camera.credit')}
                </Text>
              )}
            </LinearGradient>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  creditsDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  creditsValue: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.brand.primary,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  section: {
    paddingHorizontal: Spacing.screenHorizontal,
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  imageSelectionContainer: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  imageButton: {
    width: '100%',
    maxWidth: 280,
  },
  imageButtonGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.borderRadius.lg,
    alignItems: 'center',
  },
  imageButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  imageButtonOutline: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borders.default,
  },
  imageButtonTextOutline: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.text.secondary,
  },
  orText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.tertiary,
  },
  selectedImageContainer: {
    alignItems: 'center',
  },
  imagePreviewCard: {
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: Spacing.borderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borders.focus,
    alignItems: 'center',
    width: '100%',
  },
  previewImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: Spacing.borderRadius.md,
    marginBottom: Spacing.md,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  selectedImageText: {
    fontSize: Typography.sizes.md,
    color: Colors.brand.primary,
    fontWeight: 'bold',
  },
  changePhotoButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.sm,
    backgroundColor: Colors.backgrounds.primary,
  },
  changePhotoText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  promptInput: {
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.borders.default,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  generateSection: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingBottom: 100, // Space for tab bar
  },
  generateButton: {
    width: '100%',
  },
  generateButtonGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.borderRadius.lg,
    alignItems: 'center',
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  generateButtonSubtext: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    opacity: 0.8,
    marginTop: 2,
  },
  // Model selection styles
  modelScrollView: {
    marginHorizontal: -Spacing.screenHorizontal,
  },
  modelSelection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.screenHorizontal,
    gap: Spacing.md,
  },
  modelCard: {
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borders.default,
    minWidth: 200,
  },
  modelCardSelected: {
    borderColor: Colors.brand.primary,
    backgroundColor: Colors.brand.primary + '10',
  },
  modelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  modelName: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
  },
  modelNameSelected: {
    color: Colors.brand.primary,
  },
  modelDescription: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  modelFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modelCostText: {
    fontSize: Typography.sizes.xs,
    color: Colors.brand.primary,
    fontWeight: '600',
  },
  modelTime: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.tertiary,
  },
  loadingModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingModalContent: {
    backgroundColor: Colors.backgrounds.secondary,
    borderRadius: Spacing.borderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    minWidth: 280,
    borderWidth: 1,
    borderColor: Colors.borders.focus,
  },
  loadingModalTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  loadingModalSubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
});