import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter, useSegments } from 'expo-router';
import { RootState } from '@/store';

export default function NavigationHandler() {
  const router = useRouter();
  const segments = useSegments();
  const settings = useSelector((state: RootState) => state.settings.settings);
  const isOnboardingCompleted = settings.onboardingCompleted;

  useEffect(() => {
    console.log('NavigationHandler - segments:', segments, 'isOnboardingCompleted:', isOnboardingCompleted);
    
    // Check current route segments
    const inLoading = segments[0] === 'loading';
    const inOnboarding = segments[0] === 'onboarding';
    const inPaywall = segments[0] === 'paywall';
    const inResult = segments[0] === 'result';
    
    // Don't interfere with loading screen or specific flows
    if (inLoading || inPaywall || inResult) {
      console.log('NavigationHandler - Not interfering, in special route');
      return;
    }

    // If not onboarded and not already in onboarding flow
    if (!isOnboardingCompleted && !inOnboarding) {
      console.log('NavigationHandler - Going to onboarding');
      router.replace('/onboarding');
    }
    // If onboarded and in onboarding, go to main app
    else if (isOnboardingCompleted && inOnboarding) {
      console.log('NavigationHandler - Going to tabs');
      router.replace('/(tabs)');
    }
  }, [isOnboardingCompleted, segments, router]);

  return null;
}