import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * 
 * Delays updating a value until after a specified delay.
 * Used primarily for search inputs to avoid excessive re-renders.
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 150ms per research)
 * @returns Debounced value
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
