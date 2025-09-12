/**
 * Figure AI - AI Service Manager
 * Central service for managing AI providers and processing images
 */

import { AIProvider, AIProviderConfig, AIProcessingOptions, AIProcessingResult } from './types';
import { GeminiAIProvider } from './providers/GeminiAIProvider';
import { FalAIProvider } from './providers/FalAIProvider';
import { AIModel } from '@/types';

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private activeProvider?: AIProvider;
  private config?: AIProviderConfig;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Register AI providers
    const geminiProvider = new GeminiAIProvider();
    const falAIProvider = new FalAIProvider();
    
    this.providers.set(geminiProvider.metadata.id, geminiProvider);
    this.providers.set(falAIProvider.metadata.id, falAIProvider);

    // Use Gemini AI by default
    this.activeProvider = geminiProvider;
  }

  async initialize(config: AIProviderConfig = { apiKey: 'hardcoded' }, providerId?: string): Promise<void> {
    this.config = config;
    
    // Use specified provider or default to Gemini AI
    const targetProviderId = providerId || 'gemini_ai';
    this.activeProvider = this.providers.get(targetProviderId);

    if (!this.activeProvider) {
      throw new Error(`AI provider '${targetProviderId}' not found`);
    }

    await this.activeProvider.initialize(config);
  }

  async processImage(
    imageUri: string,
    model: AIModel,
    customPrompt?: string
  ): Promise<AIProcessingResult> {
    if (!this.activeProvider || !this.activeProvider.isAvailable()) {
      return {
        success: false,
        error: 'AI service not initialized or provider unavailable',
        creditsUsed: 0,
      };
    }

    const options: AIProcessingOptions = {
      imageUri,
      prompt: model.basePrompt,
      customPrompt,
      quality: 'high', // Can be made configurable
      strength: 0.35, // Can be made configurable per model
    };

    try {
      const result = await this.activeProvider.processImage(options);
      
      // Ensure credits used matches model configuration
      if (result.success && result.creditsUsed === undefined) {
        result.creditsUsed = model.creditsPerUse;
      }

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown error occurred during processing',
        creditsUsed: 0,
      };
    }
  }

  getActiveProvider(): AIProvider | undefined {
    return this.activeProvider;
  }

  getAvailableProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  async switchProvider(providerId: string, config?: AIProviderConfig): Promise<void> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const configToUse = config || this.config;
    if (!configToUse) {
      throw new Error('No configuration available for provider initialization');
    }

    await provider.initialize(configToUse);
    this.activeProvider = provider;
  }

  isInitialized(): boolean {
    return this.activeProvider?.isAvailable() ?? false;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.activeProvider || !this.activeProvider.isAvailable()) {
      return {
        success: false,
        error: 'No active provider available',
      };
    }

    try {
      // Use a small test image to verify the connection
      const testResult = await this.activeProvider.processImage({
        imageUri: 'test://connection',
        prompt: 'test connection',
      });

      return {
        success: testResult.success,
        error: testResult.error,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Singleton instance
export const aiService = new AIService();