/**
 * Figure AI - Settings slice for Redux store
 * Manages app settings, API keys, and AI models
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings, SettingsState, AIModel } from '@/types';

// Default AI models for figurine creation
const defaultAIModels: AIModel[] = [
  {
    id: 'premium_figurine',
    name: 'Premium Figurine',
    description: 'High-quality 1/7 scale figurine with premium packaging',
    basePrompt: 'premium quality collectible figurine, detailed craftsmanship, professional photography',
    isActive: false,
    creditsPerUse: 1,
    processingTimeEstimate: 20,
  },
  {
    id: 'anime_figurine',
    name: 'Anime Style',
    description: 'Anime-inspired figurine with vibrant colors',
    basePrompt: 'anime style figurine, vibrant colors, dynamic pose, manga aesthetic',
    isActive: false,
    creditsPerUse: 1,
    processingTimeEstimate: 18,
  },
  {
    id: 'realistic_figurine',
    name: 'Realistic Style',
    description: 'Life-like figurine with realistic proportions',
    basePrompt: 'realistic figurine, lifelike proportions, natural colors, detailed textures',
    isActive: false,
    creditsPerUse: 1,
    processingTimeEstimate: 22,
  },
  {
    id: 'fal_ai_figurine',
    name: 'Fal.AI Nano Banana',
    description: 'Advanced AI figurine creation with nano-banana technology',
    basePrompt: 'Transform this photo into a high-quality 1/7 scale collectible figurine',
    isActive: true,
    creditsPerUse: 1,
    processingTimeEstimate: 20,
  },
];

// Default app settings
const defaultSettings: AppSettings = {
  selectedAIModel: 'fal_ai_figurine',
  hapticFeedback: true,
  autoSaveToDevice: true,
  imageQuality: 'high',
  onboardingCompleted: false,
  // API key will be set later - start with client-side for development
};

const initialState: SettingsState = {
  settings: defaultSettings,
  availableModels: defaultAIModels,
  isLoading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Settings management
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    
    setAPIKey: (state, action: PayloadAction<string>) => {
      state.settings.apiKey = action.payload;
    },
    
    setSelectedAIModel: (state, action: PayloadAction<string>) => {
      const modelExists = state.availableModels.some(model => 
        model.id === action.payload && model.isActive
      );
      
      if (modelExists) {
        state.settings.selectedAIModel = action.payload;
      }
    },
    
    toggleHapticFeedback: (state) => {
      state.settings.hapticFeedback = !state.settings.hapticFeedback;
    },
    
    toggleAutoSave: (state) => {
      state.settings.autoSaveToDevice = !state.settings.autoSaveToDevice;
    },
    
    setImageQuality: (state, action: PayloadAction<'low' | 'medium' | 'high'>) => {
      state.settings.imageQuality = action.payload;
    },
    
    completeOnboarding: (state) => {
      state.settings.onboardingCompleted = true;
    },
    
    resetOnboarding: (state) => {
      state.settings.onboardingCompleted = false;
    },
    
    // AI Models management
    addAIModel: (state, action: PayloadAction<AIModel>) => {
      const existingIndex = state.availableModels.findIndex(
        model => model.id === action.payload.id
      );
      
      if (existingIndex !== -1) {
        // Update existing model
        state.availableModels[existingIndex] = action.payload;
      } else {
        // Add new model
        state.availableModels.push(action.payload);
      }
    },
    
    updateAIModel: (state, action: PayloadAction<Partial<AIModel> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      const modelIndex = state.availableModels.findIndex(model => model.id === id);
      
      if (modelIndex !== -1) {
        state.availableModels[modelIndex] = { ...state.availableModels[modelIndex], ...updates };
      }
    },
    
    toggleAIModelStatus: (state, action: PayloadAction<string>) => {
      const modelIndex = state.availableModels.findIndex(model => model.id === action.payload);
      
      if (modelIndex !== -1) {
        state.availableModels[modelIndex].isActive = !state.availableModels[modelIndex].isActive;
        
        // If disabling the currently selected model, switch to first active model
        if (!state.availableModels[modelIndex].isActive && 
            state.settings.selectedAIModel === action.payload) {
          const firstActiveModel = state.availableModels.find(model => model.isActive);
          if (firstActiveModel) {
            state.settings.selectedAIModel = firstActiveModel.id;
          }
        }
      }
    },
    
    removeAIModel: (state, action: PayloadAction<string>) => {
      const modelId = action.payload;
      state.availableModels = state.availableModels.filter(model => model.id !== modelId);
      
      // If removing the currently selected model, switch to first available
      if (state.settings.selectedAIModel === modelId) {
        const firstModel = state.availableModels.find(model => model.isActive);
        if (firstModel) {
          state.settings.selectedAIModel = firstModel.id;
        }
      }
    },
    
    // Loading and error states
    setSettingsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setSettingsError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Reset settings
    resetSettings: (state) => {
      state.settings = defaultSettings;
      state.availableModels = defaultAIModels;
      state.error = null;
    },
    
    // Development helpers
    loadModelsFromAPI: (state, action: PayloadAction<AIModel[]>) => {
      state.availableModels = action.payload;
      
      // Ensure selected model is still valid
      const selectedModelExists = action.payload.some(
        model => model.id === state.settings.selectedAIModel && model.isActive
      );
      
      if (!selectedModelExists) {
        const firstActiveModel = action.payload.find(model => model.isActive);
        if (firstActiveModel) {
          state.settings.selectedAIModel = firstActiveModel.id;
        }
      }
    },
  },
});

export const {
  updateSettings,
  setAPIKey,
  setSelectedAIModel,
  toggleHapticFeedback,
  toggleAutoSave,
  setImageQuality,
  completeOnboarding,
  resetOnboarding,
  addAIModel,
  updateAIModel,
  toggleAIModelStatus,
  removeAIModel,
  setSettingsLoading,
  setSettingsError,
  resetSettings,
  loadModelsFromAPI,
} = settingsSlice.actions;

export default settingsSlice.reducer;