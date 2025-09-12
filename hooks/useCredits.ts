/**
 * Figure AI - Credits Hook (DEPRECATED)
 * DEPRECATED: Use useServerCredits instead for server-side credit management
 * This hook is kept for backward compatibility only
 */

import { useSelector } from 'react-redux';
import { RootState } from '@/store';
// DEPRECATED: Local credit actions removed - use server-side credits
// import { useCredits as useCreditsAction, resetWeeklyCredits } from '@/store/slices/userSlice';

export function useCredits() {
  const user = useSelector((state: RootState) => state.user.user);
  
  // DEPRECATED: Return basic functionality for backward compatibility
  // Use useServerCredits() instead for real server-side credit management
  const hasCredits = (requiredCredits: number = 1): boolean => {
    return (user?.credits || 0) >= requiredCredits;
  };

  const useCreditsForGeneration = (_creditsToUse: number) => {
    console.warn('DEPRECATED: useCreditsForGeneration - use useServerCredits().spendCredits() instead');
    return false;
  };

  const checkWeeklyReset = () => {
    console.warn('DEPRECATED: checkWeeklyReset - use useServerCredits().checkWeeklyReset() instead');
  };

  const getRemainingCredits = (): number => {
    console.warn('DEPRECATED: getRemainingCredits - use useServerCredits().credits instead');
    return user?.credits || 0;
  };

  const isSubscriber = (): boolean => {
    return user?.subscriptionStatus === 'active';
  };

  const getDaysUntilReset = (): number => {
    return 0;
  };

  return {
    hasCredits,
    useCreditsForGeneration,
    checkWeeklyReset,
    getRemainingCredits,
    isSubscriber,
    getDaysUntilReset,
    credits: user?.credits || 0,
  };
}