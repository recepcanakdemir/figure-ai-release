import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
// LinearGradient removed - using solid colors for loading bar
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { RootState } from '@/store';
import { initializeLanguage } from '@/services/i18n';
import { initializeRevenueCat } from '@/services/revenuecat';
import { setRevenueCatCustomerId } from '@/store/slices/userSlice';
import { initializeWithCustomerID } from '@/services/customerid';

const { width } = Dimensions.get('window');

// Onboarding images to preload
const onboardingSteps = [
  {
    id: 1,
    title: 'Welcome to Figure AI',
    subtitle: 'Transform your photos into amazing figurines',
    image: require('../assets/images/onboarding/emrearka.png'),
  },
  {
    id: 2,
    title: 'AI-Powered Magic',
    subtitle: 'Advanced AI creates detailed figurines',
    image: require('../assets/images/onboarding/familyy.png'),
  },
];

export default function LoadingScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector((state: RootState) => 
    state.settings.settings.onboardingCompleted
  );

  // Animation values
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    console.log('Loading screen mounted, hasCompletedOnboarding:', hasCompletedOnboarding);
    
    // Initialize app and language system
    const initializeApp = async () => {
      try {
        console.log('Initializing language system...');
        // Initialize language system
        await initializeLanguage();
        
        console.log('Initializing RevenueCat...');
        // Initialize RevenueCat for subscriptions
        await initializeRevenueCat();
        
        console.log('Initializing RevenueCat with persistent Customer ID...');
        // Get/create persistent Customer ID and login to RevenueCat
        try {
          const stableCustomerId = await initializeWithCustomerID();
          console.log('✅ Stable Customer ID initialized:', stableCustomerId);
          
          // Store the persistent Customer ID in Redux
          dispatch(setRevenueCatCustomerId(stableCustomerId));
        } catch (error) {
          console.error('❌ Failed to initialize RevenueCat with Customer ID:', error);
          // Continue with app initialization even if this fails
        }
        
        console.log('Starting animations...');
        // Start logo animation
        startLogoAnimation();
        
        // Preload onboarding images if user hasn't completed onboarding
        if (!hasCompletedOnboarding) {
          console.log('Preloading onboarding images...');
          await preloadOnboardingImages();
        }
        
        // Simulate loading time (minimum 2 seconds for branding)
        setTimeout(() => {
          console.log('Loading complete, navigating...');
          // Navigate based on onboarding completion
          if (hasCompletedOnboarding) {
            console.log('Going to tabs');
            router.replace('/(tabs)');
          } else {
            console.log('Going to onboarding');
            router.replace('/onboarding');
          }
        }, 2500);
        
      } catch (error) {
        console.error('Failed to initialize app:', error);
        // Even if initialization fails, continue to app
        setTimeout(() => {
          router.replace(hasCompletedOnboarding ? '/(tabs)' : '/onboarding');
        }, 1000);
      }
    };

    // Preload onboarding images
    const preloadOnboardingImages = async () => {
      try {
        const preloadPromises = onboardingSteps.map(async (step) => {
          const resolved = Image.resolveAssetSource(step.image);
          console.log('Preloading image:', resolved.uri);
          return Image.prefetch(resolved.uri);
        });
        
        await Promise.all(preloadPromises);
        console.log('All onboarding images preloaded successfully');
      } catch (error) {
        console.warn('Failed to preload some onboarding images:', error);
        // Continue anyway - don't block the app
      }
    };

    initializeApp();
  }, [hasCompletedOnboarding, router, dispatch]);

  const startLogoAnimation = () => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Start gentle pulsing animation
      startPulseAnimation();
    });
  };

  const startPulseAnimation = () => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();
  };

  // Progress bar function removed

  return (
    <View
      style={[styles.container, {backgroundColor: Colors.backgrounds.loading}]}
    >
      <View style={styles.content}>
        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [
                { scale: logoScale },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          
          {/* You can replace the above with an actual Image component: */}
          { 
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          }
        </Animated.View>

        {/* App Name */}
        <Animated.View style={[styles.titleContainer, { opacity: logoOpacity }]}>
          <Text style={styles.appTitle}>Figure AI</Text>
          <Text style={styles.appSubtitle}>Create Amazing Figurines</Text>
        </Animated.View>

        {/* Progress bar removed - clean loading screen */}

        {/* Loading Text */}
      </View>

      {/* Bottom Branding */}
      <Animated.View style={[styles.bottomContainer, { opacity: logoOpacity }]}>
        <Text style={styles.brandingText}>Powered by AI recApp</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  logoPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoText: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: 'bold',
    color: Colors.text.primary,
    letterSpacing: 2,
  },
  logoSubtext: {
    fontSize: Typography.sizes.lg,
    fontWeight: '300',
    color: Colors.text.primary,
    letterSpacing: 4,
    marginTop: -5,
  },
  logo: {
    width: 120,
    height: 120,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl * 2,
  },
  appTitle: {
    fontSize: Typography.sizes['3xl'],
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  appSubtitle: {
    fontSize: Typography.sizes.lg,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    fontWeight: '300',
  },
  // Progress bar styles removed
  loadingTextContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '300',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: Spacing.xl * 2,
    alignItems: 'center',
  },
  brandingText: {
    fontSize: Typography.sizes.sm,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '300',
  },
});