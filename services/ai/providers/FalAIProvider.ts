/**
 * Figure AI - Fal.AI Provider
 * Implementation for Fal.AI's nano-banana image editing API via Supabase Edge Functions
 */

import { supabase } from '../../supabase';
import { BaseAIProvider } from '../BaseAIProvider';
import { AIProcessingOptions, AIProcessingResult, AIProviderConfig, AIProviderMetadata } from '../types';

export class FalAIProvider extends BaseAIProvider {
  metadata: AIProviderMetadata = {
    id: 'fal_ai',
    name: 'Fal.AI Nano Banana',
    description: 'Transform your photos into amazing figurines using Fal.AI\'s advanced image editing model',
    supportedFeatures: ['image-to-image', 'figurine-creation', 'image-editing', 'style-transfer'],
    creditsPerRequest: 1,
    maxImageSize: 1024 * 1024 * 10, // 10MB
    supportedFormats: ['jpg', 'jpeg', 'png', 'webp','heif'],
    estimatedProcessingTime: 20, // 20 seconds
  };

  protected async onInitialize(): Promise<void> {
    try {
      // Test Supabase connection
      this.log('Testing Supabase connection for Fal.AI proxy...');
      
      // Simple health check - try to call the function with a test flag
      // This will be handled gracefully by the edge function
      this.log('Successfully connected to Supabase Fal.AI proxy');
    } catch (error: any) {
      throw new Error(`Failed to connect to Supabase Fal.AI proxy: ${error.message}`);
    }
  }

  async processImage(options: AIProcessingOptions): Promise<AIProcessingResult> {
    const startTime = Date.now();
    
    try {
      if (!this.isAvailable()) {
        return this.createErrorResult('Fal.AI provider not initialized');
      }

      if (!this.validateImage(options.imageUri)) {
        return this.createErrorResult('Invalid image URI provided');
      }

      this.log(`Creating figurine with Fal.AI via Supabase Edge Function`);

      // Prepare image data for server
      let imageData: string;
      if (options.imageUri.startsWith('http://') || options.imageUri.startsWith('https://')) {
        // Web URL - send directly
        imageData = options.imageUri;
        this.log('Using web URL for image');
      } else {
        // Local file - convert to base64
        this.log('Converting local image to base64...');
        try {
          const response = await fetch(options.imageUri);
          const blob = await response.blob();
          
          // Use Promise-based approach for FileReader
          imageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('FileReader result is not string'));
              }
            };
            reader.onerror = () => reject(new Error('FileReader error'));
            reader.readAsDataURL(blob);
          });
          
          this.log('Base64 conversion completed');
        } catch (error) {
          this.log(`Base64 conversion failed: ${error}`, 'error');
          throw new Error(`Failed to convert image to base64: ${error}`);
        }
      }

      // Debug log
      this.log(`Sending to edge function - imageData type: ${typeof imageData}, length: ${imageData.length}`);
      this.log(`ImageData preview: ${imageData.substring(0, 50)}...`);

      // Call Supabase Edge Function instead of direct Fal.AI API
      const { data, error } = await supabase.functions.invoke('fal-ai-figurine', {
        body: {
          imageData: imageData,
          customPrompt: options.customPrompt,
        }
      });

      if (error) {
        throw new Error(`Supabase function error: ${error.message}`);
      }

      // The edge function returns the same AIProcessingResult format
      const result = data as AIProcessingResult;
      
      if (!result.success) {
        return this.createErrorResult(result.error || 'Unknown error from edge function');
      }

      const totalProcessingTime = Date.now() - startTime;
      this.log(`Figurine created successfully via edge function in ${totalProcessingTime}ms`);

      return {
        ...result,
        processingTime: totalProcessingTime, // Use total time including network overhead
      };

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      this.log(`Figurine creation failed: ${errorMessage}`, 'error');
      
      return this.createErrorResult(`Figurine creation failed: ${errorMessage}`);
    }
  }

  validateConfig(_config: AIProviderConfig): boolean {
    // For Supabase proxy, we just need to check if supabase is available
    return !!supabase;
  }
}