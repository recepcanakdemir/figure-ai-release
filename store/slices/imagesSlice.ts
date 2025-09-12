/**
 * Figure AI - Images slice for Redux store
 * Manages favorites and generated images
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GeneratedImage, ImagesState } from '@/types';

const initialState: ImagesState = {
  favorites: [],
  recentImages: [],
  isLoading: false,
  error: null,
};

const imagesSlice = createSlice({
  name: 'images',
  initialState,
  reducers: {
    // Add generated image
    addGeneratedImage: (state, action: PayloadAction<GeneratedImage>) => {
      const image = action.payload;
      
      // Add to recent images at the beginning
      state.recentImages.unshift(image);
      
      // Keep only last 50 recent images
      if (state.recentImages.length > 50) {
        state.recentImages = state.recentImages.slice(0, 50);
      }
      
      // If marked as favorite, add to favorites too
      if (image.isFavorite) {
        state.favorites.unshift(image);
      }
    },
    
    // Favorites management
    addToFavorites: (state, action: PayloadAction<string>) => {
      const imageId = action.payload;
      
      // Find image in recent images
      const recentImage = state.recentImages.find(img => img.id === imageId);
      if (recentImage) {
        // Mark as favorite in recent images
        recentImage.isFavorite = true;
        
        // Add to favorites if not already there
        const existsInFavorites = state.favorites.some(img => img.id === imageId);
        if (!existsInFavorites) {
          state.favorites.unshift({ ...recentImage });
        }
      }
    },
    
    removeFromFavorites: (state, action: PayloadAction<string>) => {
      const imageId = action.payload;
      
      // Remove from favorites
      state.favorites = state.favorites.filter(img => img.id !== imageId);
      
      // Update favorite status in recent images
      const recentImage = state.recentImages.find(img => img.id === imageId);
      if (recentImage) {
        recentImage.isFavorite = false;
      }
    },
    
    toggleFavorite: (state, action: PayloadAction<string>) => {
      const imageId = action.payload;
      const existsInFavorites = state.favorites.some(img => img.id === imageId);
      
      if (existsInFavorites) {
        // Remove from favorites
        state.favorites = state.favorites.filter(img => img.id !== imageId);
        
        // Update status in recent images
        const recentImage = state.recentImages.find(img => img.id === imageId);
        if (recentImage) {
          recentImage.isFavorite = false;
        }
      } else {
        // Add to favorites
        const recentImage = state.recentImages.find(img => img.id === imageId);
        if (recentImage) {
          recentImage.isFavorite = true;
          state.favorites.unshift({ ...recentImage });
        }
      }
    },
    
    // Update image data
    updateGeneratedImage: (state, action: PayloadAction<Partial<GeneratedImage> & { id: string }>) => {
      const { id, ...updates } = action.payload;
      
      // Update in recent images
      const recentImageIndex = state.recentImages.findIndex(img => img.id === id);
      if (recentImageIndex !== -1) {
        state.recentImages[recentImageIndex] = { ...state.recentImages[recentImageIndex], ...updates };
      }
      
      // Update in favorites if exists
      const favoriteImageIndex = state.favorites.findIndex(img => img.id === id);
      if (favoriteImageIndex !== -1) {
        state.favorites[favoriteImageIndex] = { ...state.favorites[favoriteImageIndex], ...updates };
      }
    },
    
    // Delete image
    deleteImage: (state, action: PayloadAction<string>) => {
      const imageId = action.payload;
      
      // Remove from recent images
      state.recentImages = state.recentImages.filter(img => img.id !== imageId);
      
      // Remove from favorites
      state.favorites = state.favorites.filter(img => img.id !== imageId);
    },
    
    // Clear all images
    clearAllImages: (state) => {
      state.recentImages = [];
      state.favorites = [];
    },
    
    clearRecentImages: (state) => {
      // Remove images that are not favorites
      state.recentImages = state.recentImages.filter(img => img.isFavorite);
    },
    
    // Loading and error states
    setImagesLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    setImagesError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // Bulk operations
    loadImagesFromStorage: (state, action: PayloadAction<{
      favorites: GeneratedImage[];
      recentImages: GeneratedImage[];
    }>) => {
      state.favorites = action.payload.favorites;
      state.recentImages = action.payload.recentImages;
    },
  },
});

export const {
  addGeneratedImage,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  updateGeneratedImage,
  deleteImage,
  clearAllImages,
  clearRecentImages,
  setImagesLoading,
  setImagesError,
  loadImagesFromStorage,
} = imagesSlice.actions;

export default imagesSlice.reducer;