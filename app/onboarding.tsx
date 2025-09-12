import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { completeOnboarding } from '@/store/slices/settingsSlice';

const { width } = Dimensions.get('window');

const onboardingSteps = [
  {
    id: 1,
    title: 'Welcome to Figure AI',
    subtitle: 'Transform your photos into amazing figurines',
    image: require('../assets/images/onboarding/emrearka.jpg'),
  },
  {
    id: 2,
    title: 'AI-Powered Magic',
    subtitle: 'Advanced AI creates detailed figurines',
    image: require('../assets/images/onboarding/familyy.jpg'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [currentStep, setCurrentStep] = useState(0);
  const step = onboardingSteps[currentStep];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - show paywall for non-subscribers
      router.push({
        pathname: '/paywall',
        params: { source: 'onboarding' }
      });
    }
  };

  const handleSkip = () => {
    // Mark onboarding as completed and go to main app
    dispatch(completeOnboarding());
    router.replace('/(tabs)');
  };

  const isLastStep = currentStep === onboardingSteps.length - 1;

  return (
    <SafeAreaView style={styles.container}>
    <ImageBackground
      source={step.image}
      resizeMode="cover"
      style={styles.background}
    >
      <View style={styles.content}>
        {/* Skip Button */}
        <View style={styles.topBar}>
          <View style={styles.progressContainer}>
            {onboardingSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index <= currentStep && styles.progressDotActive
                ]}
              />
            ))}
          </View>
          
          <Pressable style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Image */}
          <View style={styles.imageContainer}>
            <LinearGradient
              colors={['transparent', Colors.backgrounds.primary + '80']}
              style={styles.imageOverlay}
            />
          </View>

        </View>

          {/* Text Content */}
          <View style={styles.textContent}>
            <Text style={styles.stepTitle}>{step.title}</Text>
            <Text style={styles.stepSubtitle}>{step.subtitle}</Text>
          </View>
        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <Pressable style={styles.nextButton} onPress={handleNext}>
            <LinearGradient
              colors={Colors.gradients.primary as any}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {isLastStep ? 'Get Started' : 'Next'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screenHorizontal,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgrounds.secondary,
  },
  progressDotActive: {
    backgroundColor: Colors.brand.primary,
  },
  skipButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor:Colors.brand.primary,
    borderRadius:'30%',
  },
  skipText: {
    fontSize: Typography.sizes.md,
    color: Colors.text.primary,
    fontWeight: '600',

  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
    position: 'relative',
  },
  stepImage: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: Spacing.borderRadius.xl,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '30%',
    borderBottomLeftRadius: Spacing.borderRadius.xl,
    borderBottomRightRadius: Spacing.borderRadius.xl,
  },
  textContent: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: '600',
    color: Colors.brand.primary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  stepDescription: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },
  bottomActions: {
    paddingBottom: Spacing.xl,
  },
  nextButton: {
    width: '100%',
  },
  nextButtonGradient: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.borderRadius.lg,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: Typography.sizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});