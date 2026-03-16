import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive breakpoint detection using window.matchMedia API
 * 
 * @param query - Media query string (e.g., '(max-width: 767px)')
 * @returns boolean indicating if the media query matches
 * 
 * @example
 * ```tsx
 * const isMobile = useMediaQuery('(max-width: 767px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 * ```
 */
export const useMediaQuery = (query: string): boolean => {
  // Initialize with false to avoid hydration mismatch in SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Create media query list
    const mediaQuery = globalThis.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create event handler
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handler);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [query]);

  return matches;
};

/**
 * Preset breakpoint hooks based on design tokens
 * Breakpoints: sm: 640px, md: 768px, lg: 1024px, xl: 1280px
 */

/**
 * Detect mobile devices (< 768px)
 * @returns true if viewport width is less than 768px
 */
export const useIsMobile = (): boolean => {
  return useMediaQuery('(max-width: 767px)');
};

/**
 * Detect tablet devices (768px - 1023px)
 * @returns true if viewport width is between 768px and 1023px
 */
export const useIsTablet = (): boolean => {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
};

/**
 * Detect desktop devices (>= 1024px)
 * @returns true if viewport width is 1024px or greater
 */
export const useIsDesktop = (): boolean => {
  return useMediaQuery('(min-width: 1024px)');
};

/**
 * Detect if viewport is at tablet size or larger (>= 768px)
 * Useful for showing desktop-optimized UI
 * @returns true if viewport width is 768px or greater
 */
export const useIsTabletOrLarger = (): boolean => {
  return useMediaQuery('(min-width: 768px)');
};

/**
 * Detect touch-capable devices
 * Note: This doesn't guarantee touch is primary input (e.g., touchscreen laptops)
 * @returns true if device supports touch events
 */
export const useIsTouchDevice = (): boolean => {
  return useMediaQuery('(hover: none) and (pointer: coarse)');
};
