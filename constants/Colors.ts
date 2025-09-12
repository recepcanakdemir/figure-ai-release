/**
 * Figure AI - Futuristic dark theme color palette
 * Designed for a premium AI photo editing experience with purple/blue accents
 */

// Primary brand colors
const primaryPurple = '#8B5FFF';
const primaryBlue = '#4F46E5';
const accentCyan = '#06E7F0';
const accentPink = '#FF6B9D';
const loadingPurple = '#2c0634';

// Neutral colors for dark theme
const darkBackground = '#0A0A0F';
const cardBackground = '#141420';
const surfaceBackground = '#1E1E2E';
const borderColor = '#2A2A3A';

// Text colors
const textPrimary = '#FFFFFF';
const textSecondary = '#B4B4C8';
const textTertiary = '#6B6B80';

export const Colors = {
  // Keep light theme minimal since app is primarily dark
  light: {
    text: textPrimary,
    background: darkBackground,
    tint: primaryPurple,
    icon: textSecondary,
    tabIconDefault: textTertiary,
    tabIconSelected: primaryPurple,
  },
  dark: {
    text: textPrimary,
    background: darkBackground,
    tint: primaryPurple,
    icon: textSecondary,
    tabIconDefault: textTertiary,
    tabIconSelected: primaryPurple,
  },
  // Extended color palette for Figure AI
  brand: {
    primary: primaryPurple,
    secondary: primaryBlue,
    accent: accentCyan,
    highlight: accentPink,
  },
  backgrounds: {
    primary: darkBackground,
    secondary: cardBackground,
    surface: surfaceBackground,
    overlay: 'rgba(10, 10, 15, 0.9)',
    loading: darkBackground,
  },
  borders: {
    default: borderColor,
    focus: primaryPurple,
    error: '#FF5757',
    success: '#00D9A5',
  },
  text: {
    primary: textPrimary,
    secondary: textSecondary,
    tertiary: textTertiary,
    inverse: darkBackground,
    error: '#FF5757',
    success: '#00D9A5',
    warning: '#FFB800',
  },
  gradients: {
    primary: [primaryPurple, primaryBlue],
    accent: [accentCyan, accentPink],
    surface: [cardBackground, surfaceBackground],
  },
};
