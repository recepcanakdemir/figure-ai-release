import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ImageBackground,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { router } from 'expo-router';

import { Colors } from '@/constants/Colors';
import { Typography } from '@/constants/Typography';
import { Spacing } from '@/constants/Spacing';
import { RootState } from '@/store';
import { toggleFavorite, deleteImage } from '@/store/slices/imagesSlice';
import { GeneratedImage } from '@/types';
import ImagePreviewModal from '@/components/shared/ImagePreviewModal';

const { width } = Dimensions.get('window');
const itemSize = (width - Spacing.screenHorizontal * 2 - Spacing.md) / 2;

export default function FavoritesScreen() {
  const dispatch = useDispatch();
  const favorites = useSelector((state: RootState) => state.images.favorites);
  
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [previewImage, setPreviewImage] = useState<GeneratedImage | null>(null);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  const toggleSelection = (imageId: string) => {
    if (selectedItems.includes(imageId)) {
      setSelectedItems(selectedItems.filter(id => id !== imageId));
    } else {
      setSelectedItems([...selectedItems, imageId]);
    }
  };

  const enterSelectionMode = (imageId: string) => {
    setIsSelectionMode(true);
    setSelectedItems([imageId]);
  };

  const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedItems([]);
  };

  const removeFromFavorites = () => {
    Alert.alert(
      'Remove from Favorites',
      `Remove ${selectedItems.length} figurine${selectedItems.length > 1 ? 's' : ''} from favorites?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            selectedItems.forEach(imageId => {
              dispatch(toggleFavorite(imageId));
            });
            exitSelectionMode();
          },
        },
      ]
    );
  };

  const deleteFromDevice = () => {
    Alert.alert(
      'Delete Figurines',
      `Permanently delete ${selectedItems.length} figurine${selectedItems.length > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedItems.forEach(imageId => {
              dispatch(deleteImage(imageId));
            });
            exitSelectionMode();
          },
        },
      ]
    );
  };

  const openPreview = (image: GeneratedImage) => {
    setPreviewImage(image);
    setIsPreviewVisible(true);
  };

  const closePreview = () => {
    setPreviewImage(null);
    setIsPreviewVisible(false);
  };

  const viewImage = (image: GeneratedImage) => {
    if (isSelectionMode) {
      toggleSelection(image.id);
    } else {
      openPreview(image);
    }
  };

  const renderFavoriteItem = ({ item }: { item: GeneratedImage }) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <Pressable
        style={[styles.favoriteItem, isSelected && styles.favoriteItemSelected]}
        onPress={() => viewImage(item)}
        onLongPress={() => !isSelectionMode && enterSelectionMode(item.id)}
      >
        <ImageBackground
          source={{ uri: item.generatedImageUri }}
          style={styles.favoriteImage}
          imageStyle={styles.favoriteImageStyle}
        >
          {isSelectionMode && (
            <View style={styles.selectionOverlay}>
              <View style={[styles.selectionCircle, isSelected && styles.selectionCircleSelected]}>
                {isSelected && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </View>
          )}
          
          <View style={styles.imageInfo}>
            <Text style={styles.imageModel} numberOfLines={1}>
              {item.aiModel}
            </Text>
            <Text style={styles.imageDate}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </ImageBackground>
      </Pressable>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No Figurines Yet</Text>
      <Text style={styles.emptySubtitle}>
        Your favorite figurines will appear here. Start creating your collection!
      </Text>
      <Pressable
        style={styles.createButton}
        onPress={() => router.push('/(tabs)/camera')}
      >
        <Text style={styles.createButtonText}>Create Your First Figurine</Text>
      </Pressable>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>Favorites</Text>
        {favorites.length > 0 && (
          <Text style={styles.subtitle}>
            {favorites.length} figurine{favorites.length > 1 ? 's' : ''} saved
          </Text>
        )}
      </View>

      {favorites.length > 0 && !isSelectionMode && (
        <Pressable
          style={styles.selectButton}
          onPress={() => setIsSelectionMode(true)}
        >
          <Text style={styles.selectButtonText}>Select</Text>
        </Pressable>
      )}

      {isSelectionMode && (
        <View style={styles.selectionActions}>
          <Pressable
            style={styles.actionButton}
            onPress={exitSelectionMode}
          >
            <Text style={styles.actionButtonText}>Cancel</Text>
          </Pressable>
          
          {selectedItems.length > 0 && (
            <>
              <Pressable
                style={styles.actionButton}
                onPress={removeFromFavorites}
              >
                <Text style={[styles.actionButtonText, styles.actionButtonDanger]}>
                  Remove ({selectedItems.length})
                </Text>
              </Pressable>
              
              <Pressable
                style={styles.actionButton}
                onPress={deleteFromDevice}
              >
                <Text style={[styles.actionButtonText, styles.actionButtonDanger]}>
                  Delete ({selectedItems.length})
                </Text>
              </Pressable>
            </>
          )}
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      {favorites.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bottom padding for tab bar */}
      <View style={styles.bottomPadding} />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        visible={isPreviewVisible}
        image={previewImage}
        onClose={closePreview}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgrounds.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.sizes['2xl'],
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  selectButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.borderRadius.md,
    backgroundColor: Colors.backgrounds.secondary,
    borderWidth: 1,
    borderColor: Colors.borders.default,
  },
  selectButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  actionButtonText: {
    fontSize: Typography.sizes.sm,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  actionButtonDanger: {
    color: Colors.borders.error,
  },
  gridContainer: {
    paddingHorizontal: Spacing.screenHorizontal,
  },
  row: {
    justifyContent: 'space-between',
  },
  favoriteItem: {
    width: itemSize,
    height: itemSize,
    marginBottom: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
    overflow: 'hidden',
  },
  favoriteItemSelected: {
    borderWidth: 3,
    borderColor: Colors.brand.primary,
  },
  favoriteImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },
  favoriteImageStyle: {
    borderRadius: Spacing.borderRadius.lg,
  },
  selectionOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderWidth: 2,
    borderColor: Colors.text.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionCircleSelected: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  checkmark: {
    color: Colors.text.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageInfo: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: Spacing.sm,
  },
  imageModel: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.primary,
    fontWeight: 'bold',
  },
  imageDate: {
    fontSize: Typography.sizes.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenHorizontal,
  },
  emptyTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: Typography.sizes.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: Colors.brand.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.borderRadius.lg,
  },
  createButtonText: {
    fontSize: Typography.sizes.md,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  bottomPadding: {
    height: 100, // Space for tab bar
  },
});