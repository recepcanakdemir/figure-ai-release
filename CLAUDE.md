# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Figure AI** - An AI-powered photo editing app for iOS App Store built with Expo React Native, TypeScript, and file-based routing. The app allows users to upload photos and apply AI transformations with a credit-based subscription model.

## Development Commands

- `npm install` - Install dependencies
- `npx expo start` - Start the development server
- `npm run android` - Start on Android emulator
- `npm run ios` - Start on iOS simulator  
- `npm run web` - Start web version
- `npm run lint` - Run ESLint
- `npm run reset-project` - Move starter code to app-example and create blank app directory

## App Features

**Core Functionality**:
- AI-powered image-to-image transformations
- Credit-based usage system (weekly resets)
- Subscription management via RevenueCat ($29.99 lifetime, $4.99 weekly)
- Image favorites and local storage
- Camera integration and photo library access

**User Flow**:
1. Onboarding with example results
2. Home screen showcasing hardcoded examples
3. Camera/upload photo functionality
4. AI processing with hardcoded + custom prompts
5. Result preview with paywall trigger (for non-subscribers)
6. Save to device and favorites
7. Favorites management

## Architecture

**File-based Routing**: Uses expo-router with custom navigation structure
- `app/_layout.tsx` - Root layout with Redux provider and theme
- `app/onboarding/` - Onboarding flow screens
- `app/(tabs)/` - Main app navigation (Home, Camera, Favorites)
- `app/paywall.tsx` - Subscription paywall modal
- `app/result.tsx` - AI result preview modal

**State Management**: Redux Toolkit with persistent storage
- `store/slices/userSlice.ts` - User data, subscription status, credits
- `store/slices/imagesSlice.ts` - Favorites and generated images
- `store/slices/settingsSlice.ts` - App settings and API keys

**Services Architecture**:
- `services/ai/` - Modular AI provider system (extensible for new models)
- `services/storage/` - Local storage and favorites management
- `services/revenuecat/` - Subscription and purchase handling
- `services/camera/` - Image picker and camera utilities

**Component Structure**:
- `components/ui/` - Futuristic themed UI components
- `components/shared/` - Reusable app components
- `types/` - TypeScript definitions for AI, user, and app data

**Design System**:
- Futuristic dark theme with purple/blue accents
- Modern icons and intuitive UI
- Custom animations and haptic feedback
- Responsive layouts for different screen sizes

**Key Technical Details**:
- Development credits: 100 (client-side for testing)
- AI models: Extensible service pattern for easy addition
- Offline support: Local favorites and image caching
- Platform-specific implementations where needed
- TypeScript strict mode with comprehensive types