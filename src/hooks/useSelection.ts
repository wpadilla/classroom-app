import { useState, useCallback, useMemo } from 'react';

/**
 * Generic selection state management hook using Set for O(1) operations
 * 
 * @template T - Type of items being selected (must have an id property)
 * @returns Selection state and methods
 * 
 * @example
 * ```tsx
 * const { 
 *   selectedIds, 
 *   toggleOne, 
 *   toggleAll, 
 *   clear,
 *   isSelected,
 *   selectedCount 
 * } = useSelection<IUser>();
 * 
 * // Toggle single item
 * <Checkbox checked={isSelected(user.id)} onChange={() => toggleOne(user.id)} />
 * 
 * // Select all
 * <Button onClick={() => toggleAll(allUsers.map(u => u.id))}>Select All</Button>
 * ```
 */
export interface UseSelectionReturn {
  /** Set of selected item IDs */
  selectedIds: Set<string>;
  
  /** Toggle selection for a single item */
  toggleOne: (id: string) => void;
  
  /** Toggle all items (select all if none/some selected, deselect all if all selected) */
  toggleAll: (allIds: string[]) => void;
  
  /** Clear all selections */
  clear: () => void;
  
  /** Check if a specific item is selected */
  isSelected: (id: string) => boolean;
  
  /** Check if all items are selected */
  isAllSelected: (allIds: string[]) => boolean;
  
  /** Get count of selected items */
  selectedCount: number;
  
  /** Set the selected IDs directly (for controlled usage) */
  setSelectedIds: (ids: Set<string>) => void;
}

export const useSelection = (): UseSelectionReturn => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /**
   * Toggle selection for a single item
   */
  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  /**
   * Toggle all items
   * - If all are selected: deselect all
   * - If none or some are selected: select all
   */
  const toggleAll = useCallback((allIds: string[]) => {
    setSelectedIds(prev => {
      const allSelected = allIds.length > 0 && allIds.every(id => prev.has(id));
      
      if (allSelected) {
        // Deselect all
        return new Set();
      } else {
        // Select all
        return new Set(allIds);
      }
    });
  }, []);

  /**
   * Clear all selections
   */
  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  /**
   * Check if a specific item is selected
   */
  const isSelected = useCallback((id: string): boolean => {
    return selectedIds.has(id);
  }, [selectedIds]);

  /**
   * Check if all items are selected
   */
  const isAllSelected = useCallback((allIds: string[]): boolean => {
    if (allIds.length === 0) return false;
    return allIds.every(id => selectedIds.has(id));
  }, [selectedIds]);

  /**
   * Get count of selected items
   */
  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  return {
    selectedIds,
    toggleOne,
    toggleAll,
    clear,
    isSelected,
    isAllSelected,
    selectedCount,
    setSelectedIds,
  };
};

/**
 * Alternative hook that takes initial IDs
 */
export const useSelectionWithInitial = (initialIds: string[] = []): UseSelectionReturn => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(initialIds));

  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  const toggleAll = useCallback((allIds: string[]) => {
    setSelectedIds(prev => {
      const allSelected = allIds.length > 0 && allIds.every(id => prev.has(id));
      
      if (allSelected) {
        return new Set();
      } else {
        return new Set(allIds);
      }
    });
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string): boolean => {
    return selectedIds.has(id);
  }, [selectedIds]);

  const isAllSelected = useCallback((allIds: string[]): boolean => {
    if (allIds.length === 0) return false;
    return allIds.every(id => selectedIds.has(id));
  }, [selectedIds]);

  const selectedCount = useMemo(() => selectedIds.size, [selectedIds]);

  return {
    selectedIds,
    toggleOne,
    toggleAll,
    clear,
    isSelected,
    isAllSelected,
    selectedCount,
    setSelectedIds,
  };
};
