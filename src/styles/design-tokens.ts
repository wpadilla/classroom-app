/**
 * Design System Tokens
 * 
 * Distinctive design system for Classroom App following:
 * - UI/UX Expert principles (research-backed patterns)
 * - Frontend Designer principles (avoiding generic AI aesthetics)
 * 
 * Color Palette: Educational Warmth (not generic purple gradients)
 * Typography: Space Grotesk + IBM Plex Sans (not Inter/Roboto)
 */

export const colors = {
  // Primary: Deep Blue (trust, authority)
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#1e3a8a', // Main primary color
    700: '#1e40af',
    800: '#1e3a8a',
    900: '#1e293b',
  },
  
  // Accent: Amber (energy, attention)
  accent: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b', // Main accent color
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Success: Emerald (completion, positive)
  success: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
  },
  
  // Danger: Red (errors, critical)
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Warning: Amber (caution, pending)
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Neutral: Gray (text, borders, backgrounds)
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
};

export const typography = {
  // Distinctive font pairing (not Inter/Roboto)
  fontFamily: {
    display: ['Space Grotesk', 'system-ui', 'sans-serif'], // Headings
    body: ['IBM Plex Sans', 'system-ui', 'sans-serif'], // Body text
    mono: ['JetBrains Mono', 'monospace'], // Code/technical
  },
  
  // Mobile-first scale (rem units, base 16px)
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px - captions
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px - secondary text
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px - body
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px - subheadings
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px - card titles
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px - section headings
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px - page titles
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px - hero
  },
  
  // Weight extremes (not modest 400 vs 600)
  fontWeight: {
    light: '300',
    normal: '400',
    semibold: '600',
    bold: '700',
    black: '900',
  },
};

export const spacing = {
  // 8px base grid
  0: '0',
  1: '0.25rem',  // 4px
  2: '0.5rem',   // 8px
  3: '0.75rem',  // 12px
  4: '1rem',     // 16px
  5: '1.25rem',  // 20px
  6: '1.5rem',   // 24px
  8: '2rem',     // 32px
  10: '2.5rem',  // 40px
  12: '3rem',    // 48px
  16: '4rem',    // 64px
  20: '5rem',    // 80px
  24: '6rem',    // 96px
};

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  '2xl': '1.5rem', // 24px
  full: '9999px',
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
};

export const animations = {
  // Framer Motion animation presets
  
  // Page entry - staggered list reveals
  listItem: {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.3,
        ease: 'easeOut',
      } 
    },
  },
  
  // Button press
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 },
  },
  
  // Swipe gesture
  swipe: {
    x: [-200, 0],
    transition: { 
      type: 'spring', 
      stiffness: 300, 
      damping: 30 
    },
  },
  
  // Fade in/out
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
  },
  
  // Slide up (bottom sheet)
  slideUp: {
    initial: { y: '100%' },
    animate: { y: 0 },
    exit: { y: '100%' },
    transition: { 
      type: 'spring', 
      damping: 30, 
      stiffness: 300 
    },
  },
  
  // Scale (modal)
  scale: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.2 },
  },
};

export const breakpoints = {
  sm: '640px',   // Small tablets
  md: '768px',   // Tablets
  lg: '1024px',  // Desktops
  xl: '1280px',  // Large desktops
  '2xl': '1536px', // Extra large
};

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export const transitions = {
  // Duration
  fast: '150ms',
  base: '200ms',
  medium: '300ms',
  slow: '500ms',
  
  // Easing
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// Export as single design system object
export const designSystem = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animations,
  breakpoints,
  zIndex,
  transitions,
};

export default designSystem;
