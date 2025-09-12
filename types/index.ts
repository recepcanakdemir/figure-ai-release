/**
 * Figure AI - Type definitions
 */

// User and subscription types
export interface User {
  id: string; // This is the RevenueCat Customer ID
  email?: string;
  subscriptionStatus: SubscriptionStatus;
  subscriptionType?: SubscriptionType;
  credits: number;
  weeklyCreditsResetDate: string; // ISO date string
  createdAt: string;
  lastActiveAt: string;
}

export type SubscriptionStatus = 'free' | 'active' | 'inactive' | 'expired' | 'cancelled';
export type SubscriptionType = 'weekly' | 'monthly';

export interface SubscriptionProduct {
  id: string;
  type: SubscriptionType;
  price: number;
  title: string;
  description: string;
  features: string[];
  creditsPerWeek: number;
}

// Image and AI processing types
export interface GeneratedImage {
  id: string;
  originalImageUri: string;
  generatedImageUri: string;
  prompt: string;
  customPrompt?: string;
  aiModel: string;
  createdAt: string;
  isFavorite: boolean;
  processingTime?: number;
  creditsUsed: number;
}

export interface AIModel {
  id: string;
  name: string;
  description: string;
  basePrompt: string;
  isActive: boolean;
  creditsPerUse: number;
  processingTimeEstimate: number; // in seconds
}

export interface AIProcessingRequest {
  imageUri: string;
  modelId: string;
  customPrompt?: string;
  userId: string;
}

export interface AIProcessingResponse {
  success: boolean;
  imageUri?: string;
  error?: string;
  processingTime?: number;
}

// App state types
export interface AppSettings {
  apiKey?: string;
  selectedAIModel: string;
  hapticFeedback: boolean;
  autoSaveToDevice: boolean;
  imageQuality: 'low' | 'medium' | 'high';
  onboardingCompleted: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  imageUri: string;
  isComplete: boolean;
}

// Navigation types
export type RootStackParamList = {
  onboarding: undefined;
  main: undefined;
  paywall: {
    source?: 'result' | 'home' | 'settings';
  };
  result: {
    generatedImage: GeneratedImage;
  };
  camera: undefined;
  favorites: undefined;
};

export type TabParamList = {
  home: undefined;
  camera: undefined;
  favorites: undefined;
};

// API and service types
export interface APIError {
  code: string;
  message: string;
  details?: any;
}

export interface CameraOptions {
  mediaTypes: 'Images';
  allowsEditing: boolean;
  aspect: [number, number];
  quality: number;
}

export interface SaveImageOptions {
  uri: string;
  filename?: string;
  album?: string;
}

// Redux state types
export interface RootState {
  user: UserState;
  images: ImagesState;
  settings: SettingsState;
}

export interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  subscriptionProducts: SubscriptionProduct[];
}

export interface ImagesState {
  favorites: GeneratedImage[];
  recentImages: GeneratedImage[];
  isLoading: boolean;
  error: string | null;
}

export interface SettingsState {
  settings: AppSettings;
  availableModels: AIModel[];
  isLoading: boolean;
  error: string | null;
}