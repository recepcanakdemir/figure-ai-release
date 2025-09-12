/**
 * Figure AI - Typography system
 * Defines text styles for a futuristic and modern design
 */

export const Typography = {
  // Font families
  fonts: {
    regular: 'SpaceMono',
    bold: 'SpaceMono-Bold',
    light: 'SpaceMono-Light',
  },
  
  // Font sizes
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line heights
  lineHeights: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 28,
    xl: 30,
    '2xl': 32,
    '3xl': 36,
    '4xl': 42,
    '5xl': 56,
  },
  
  // Pre-defined text styles
  styles: {
    // Headers
    h1: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: 'bold' as const,
      letterSpacing: -1,
    },
    h2: {
      fontSize: 36,
      lineHeight: 42,
      fontWeight: 'bold' as const,
      letterSpacing: -0.5,
    },
    h3: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '600' as const,
      letterSpacing: -0.25,
    },
    h4: {
      fontSize: 24,
      lineHeight: 32,
      fontWeight: '600' as const,
    },
    h5: {
      fontSize: 20,
      lineHeight: 30,
      fontWeight: '600' as const,
    },
    h6: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '600' as const,
    },
    
    // Body text
    body: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '400' as const,
    },
    bodyLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    
    // Captions and labels
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.4,
    },
    label: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
    labelLarge: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
      letterSpacing: 0.1,
    },
    
    // Buttons
    button: {
      fontSize: 16,
      lineHeight: 24,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    },
    buttonLarge: {
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '600' as const,
      letterSpacing: 0.5,
    },
    buttonSmall: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '600' as const,
      letterSpacing: 0.25,
    },
  },
};