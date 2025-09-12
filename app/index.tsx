import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    console.log('Index screen mounted, redirecting to loading...');
    // Always redirect to loading screen on app start
    router.replace('/loading' as any);
  }, [router]);

  return null;
}