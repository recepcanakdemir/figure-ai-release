import { ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { View, Text } from 'react-native';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { store, persistor } from '@/store';
import { Colors } from '@/constants/Colors';
import NavigationHandler from '@/components/NavigationHandler';
import { initializeLanguage } from '@/services/i18n';

// Figure AI custom dark theme
const FigureAITheme = {
  dark: true,
  colors: {
    primary: Colors.brand.primary,
    background: Colors.backgrounds.primary,
    card: Colors.backgrounds.secondary,
    text: Colors.text.primary,
    border: Colors.borders.default,
    notification: Colors.brand.accent,
  },
  fonts: {
    regular: {
      fontFamily: 'SpaceMono',
      fontWeight: '400' as const,
    },
    medium: {
      fontFamily: 'SpaceMono',
      fontWeight: '500' as const,
    },
    bold: {
      fontFamily: 'SpaceMono',
      fontWeight: '700' as const,
    },
    heavy: {
      fontFamily: 'SpaceMono',
      fontWeight: '900' as const,
    },
  },
};

// Loading component for PersistGate
function LoadingView() {
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: Colors.backgrounds.primary, 
      justifyContent: 'center', 
      alignItems: 'center' 
    }}>
      <Text style={{ color: Colors.text.primary, fontSize: 18 }}>
        Figure AI
      </Text>
    </View>
  );
}

// Prevent the splash screen from auto-hiding before we can control it
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Hide splash screen immediately when app loads
  useEffect(() => {
    if (loaded) {
      // Hide splash screen as quickly as possible
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Language initialization is now handled in the loading screen

  if (!loaded) {
    return <LoadingView />;
  }

  return (
    <Provider store={store}>
      <PersistGate loading={<LoadingView />} persistor={persistor}>
        <ThemeProvider value={FigureAITheme}>
          {/* NavigationHandler disabled - loading screen handles navigation */}
          {/* <NavigationHandler /> */}
          <Stack
            screenOptions={{
              headerStyle: {
                backgroundColor: Colors.backgrounds.primary,
              },
              headerTintColor: Colors.text.primary,
              headerShadowVisible: false,
            }}
            initialRouteName="loading"
          >
            <Stack.Screen name="loading" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen 
              name="paywall" 
              options={{ 
                headerShown: false,
              }} 
            />
            <Stack.Screen 
              name="result" 
              options={{ 
                headerShown: true,
                headerTitle: 'AI Result',
                presentation: 'modal',
              }} 
            />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="light" backgroundColor={Colors.backgrounds.primary} />
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}
