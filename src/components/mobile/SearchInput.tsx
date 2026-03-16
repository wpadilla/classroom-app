/**
 * SearchInput Component
 * 
 * Mobile-optimized search input with:
 * - Debounced filtering (150ms per research)
 * - Clear button
 * - Loading state
 * - Keyboard navigation (Enter to submit, Escape to clear)
 * - Touch-optimized (48px height)
 * 
 * Usage:
 *   <SearchInput
 *     placeholder="Buscar estudiantes por nombre o teléfono..."
 *     onSearch={setFilterQuery}
 *     debounceMs={150}
 *   />
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '../../hooks/useDebounce';

export interface SearchInputProps {
  placeholder?: string;
  onSearch: (query: string) => void;
  debounceMs?: number;
  className?: string;
  loading?: boolean;
  autoFocus?: boolean;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  placeholder = 'Buscar...',
  onSearch,
  debounceMs = 150,
  className = '',
  loading = false,
  autoFocus = false,
}) => {
  const [value, setValue] = useState('');
  const debouncedValue = useDebounce(value, debounceMs);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    onSearch(debouncedValue);
  }, [debouncedValue, onSearch]);

  const handleClear = () => {
    setValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Icon */}
      <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <i className="bi bi-search text-neutral-400 text-lg"></i>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className={`
          w-full pl-10 pr-10 py-3 
          bg-white border border-neutral-300 rounded-lg
          text-base text-neutral-900 placeholder-neutral-400
          focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
          transition-all duration-200
          min-h-touch-lg
          ${className}
        `}
        aria-label={placeholder}
      />

      {/* Right Icons (Loading or Clear) */}
      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
        {loading ? (
          <div className="animate-spin">
            <i className="bi bi-arrow-repeat text-neutral-400 text-lg"></i>
          </div>
        ) : value ? (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
            aria-label="Limpiar búsqueda"
            type="button"
          >
            <i className="bi bi-x-circle-fill text-neutral-400 text-lg hover:text-neutral-600"></i>
          </button>
        ) : null}
      </div>
    </div>
  );
};
