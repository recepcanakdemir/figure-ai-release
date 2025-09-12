/**
 * Figure AI - AI Service Types
 * Common types used across all AI providers
 */

export interface AIProviderConfig {
  apiKey: string;
  baseURL?: string;
  timeout?: number;
}

export interface AIProcessingOptions {
  imageUri: string;
  prompt: string;
  customPrompt?: string;
  quality?: 'low' | 'medium' | 'high';
  style?: string;
  strength?: number; // 0-1, how much to modify the original image
}

export interface AIProcessingResult {
  success: boolean;
  imageUri?: string;
  error?: string;
  processingTime?: number;
  creditsUsed?: number;
  metadata?: {
    originalSize?: { width: number; height: number };
    processedSize?: { width: number; height: number };
    model?: string;
    parameters?: Record<string, any>;
  };
}

export interface AIProviderMetadata {
  id: string;
  name: string;
  description: string;
  supportedFeatures: string[];
  creditsPerRequest: number;
  maxImageSize: number;
  supportedFormats: string[];
  estimatedProcessingTime: number;
}

export interface AIProvider {
  metadata: AIProviderMetadata;
  initialize(config: AIProviderConfig): Promise<void>;
  processImage(options: AIProcessingOptions): Promise<AIProcessingResult>;
  isAvailable(): boolean;
  validateConfig(config: AIProviderConfig): boolean;
}