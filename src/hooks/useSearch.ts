import { useState, useMemo } from 'react';
import { useDebounce } from './useDebounce';

/**
 * useSearch Hook
 * 
 * Generic search/filter hook with debouncing for lists.
 * Implements client-side filtering with case-insensitive matching.
 * 
 * @param items - Array of items to search through
 * @param searchFields - Array of field names to search in
 * @param debounceMs - Debounce delay (default: 150ms)
 * @returns Object with filteredItems, searchQuery, setSearchQuery, isSearching
 */
export function useSearch<T extends Record<string, any>>(
  items: T[],
  searchFields: (keyof T)[],
  debounceMs: number = 150
) {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, debounceMs);

  const filteredItems = useMemo(() => {
    if (!debouncedQuery.trim()) {
      return items;
    }

    const query = debouncedQuery.toLowerCase().trim();

    return items.filter((item) => {
      return searchFields.some((field) => {
        const value = item[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [items, searchFields, debouncedQuery]);

  return {
    filteredItems,
    searchQuery,
    setSearchQuery,
    isSearching: searchQuery !== debouncedQuery,
  };
}
