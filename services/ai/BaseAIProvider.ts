/**
 * Figure AI - Base AI Provider
 * Abstract base class for all AI providers with common functionality
 */

import { AIProvider, AIProviderConfig, AIProcessingOptions, AIProcessingResult, AIProviderMetadata } from './types';

export abstract class BaseAIProvider implements AIProvider {
  protected config?: AIProviderConfig;
  protected initialized = false;

  abstract metadata: AIProviderMetadata;

  async initialize(config: AIProviderConfig): Promise<void> {
    if (!this.validateConfig(config)) {
      throw new Error(`Invalid configuration for ${this.metadata.name}`);
    }
    
    this.config = config;
    this.initialized = true;
    
    // Override in subclasses for provider-specific initialization
    await this.onInitialize();
  }

  abstract processImage(options: AIProcessingOptions): Promise<AIProcessingResult>;

  isAvailable(): boolean {
    return this.initialized && this.config !== undefined;
  }

  validateConfig(config: AIProviderConfig): boolean {
    return !!(config.apiKey && config.apiKey.length > 0);
  }

  protected async onInitialize(): Promise<void> {
    // Override in subclasses for custom initialization logic
  }

  protected createPrompt(basePrompt: string, customPrompt?: string): string {
    if (!customPrompt) {
      return basePrompt;
    }
    
    return `${basePrompt}, ${customPrompt}`;
  }

  protected validateImage(imageUri: string): boolean {
    // Basic validation - can be extended in subclasses
    return imageUri.length > 0;
  }

  protected createErrorResult(error: string): AIProcessingResult {
    return {
      success: false,
      error,
      creditsUsed: 0,
    };
  }

  protected createSuccessResult(
    imageUri: string, 
    processingTime: number, 
    creditsUsed: number = this.metadata.creditsPerRequest
  ): AIProcessingResult {
    return {
      success: true,
      imageUri,
      processingTime,
      creditsUsed,
    };
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = `[${this.metadata.name}] ${timestamp}:`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }
}