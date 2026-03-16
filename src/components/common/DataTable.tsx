import React, { useState, useMemo, useCallback } from 'react';
import { Table, Input } from 'reactstrap';
import { motion } from 'framer-motion';
import { SearchInput } from '../mobile/SearchInput';
import { EmptyState } from '../mobile/EmptyState';
import { LoadingState } from '../mobile/LoadingState';
import { Dialog } from './Dialog';
import { useIsMobile } from '../../hooks/useMediaQuery';

/**
 * Column definition for DataTable
 */
export interface Column<T> {
  /** Column header text or element */
  header: string | React.ReactNode;
  
  /** Field accessor or function to extract value */
  accessor?: keyof T | ((row: T, index: number) => any);
  
  /** Custom render function for cell content */
  render?: (value: any, row: T, index: number) => React.ReactNode;
  
  /** Fixed column width */
  width?: string;
  
  /** Additional CSS classes for column */
  className?: string;
  
  /** Hide column on mobile (<768px) */
  mobileHidden?: boolean;
  
  /** Align column content */
  align?: 'left' | 'center' | 'right';
}

/**
 * DataTable component props
 */
export interface DataTableProps<T> {
  /** Array of data items to render */
  data: T[];
  
  /** Column definitions */
  columns: Column<T>[];
  
  /** Function to extract unique key from each row */
  keyExtractor: (row: T, index: number) => string;
  
  // Search functionality
  /** Enable search input */
  searchable?: boolean;
  
  /** Fields to search across */
  searchFields?: (keyof T)[];
  
  /** Custom search placeholder text */
  searchPlaceholder?: string;
  
  /** External search query control */
  externalSearchQuery?: string;
  
  /** Callback when search changes */
  onSearchChange?: (query: string) => void;
  
  // Selection functionality
  /** Enable row selection with checkboxes */
  selectable?: boolean;
  
  /** Currently selected row IDs */
  selectedIds?: Set<string>;
  
  /** Callback when selection changes */
  onSelectionChange?: (ids: Set<string>) => void;
  
  // Row expansion
  /** Enable row expansion */
  expandable?: boolean;
  
  /** Render function for expanded row content */
  renderExpandedRow?: (row: T, index: number) => React.ReactNode;
  
  /** Currently expanded row IDs */
  expandedIds?: Set<string>;
  
  /** Callback when expansion changes */
  onExpandChange?: (id: string) => void;
  
  // Actions
  /** Render function for row actions (last column) */
  actions?: (row: T, index: number) => React.ReactNode;
  
  /** Bulk actions component (shown when items selected) */
  bulkActions?: React.ReactNode;
  
  // States
  /** Custom empty state component */
  emptyState?: React.ReactNode;
  
  /** Show loading skeleton */
  loading?: boolean;
  
  /** Number of skeleton rows to show */
  loadingRows?: number;
  
  // Events
  /** Callback when row is clicked */
  onRowClick?: (row: T, index: number) => void;
  
  /** Additional CSS classes for table */
  className?: string;
  
  /** Make table striped */
  striped?: boolean;
  
  /** Make table hoverable */
  hover?: boolean;
  
  /** Make table bordered */
  bordered?: boolean;
}

/**
 * DataTable Component
 * 
 * Reusable, feature-rich data table with:
 * - Built-in search with debounce
 * - Multi-select with checkbox column
 * - Expandable rows (inline on desktop, Dialog on mobile)
 * - Bulk actions bar
 * - Loading skeleton states
 * - Empty states
 * - Responsive column hiding
 * - Animated row rendering
 * 
 * @example
 * ```tsx
 * <DataTable
 *   data={students}
 *   columns={[
 *     { header: 'Name', accessor: 'firstName' },
 *     { header: 'Email', accessor: 'email', mobileHidden: true },
 *   ]}
 *   keyExtractor={(s) => s.id}
 *   searchable
 *   searchFields={['firstName', 'lastName', 'email']}
 *   selectable
 *   selectedIds={selectedIds}
 *   onSelectionChange={setSelectedIds}
 * />
 * ```
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchable = false,
  searchFields,
  searchPlaceholder = 'Buscar...',
  externalSearchQuery,
  onSearchChange,
  selectable = false,
  selectedIds = new Set(),
  onSelectionChange,
  expandable = false,
  renderExpandedRow,
  expandedIds: externalExpandedIds,
  onExpandChange,
  actions,
  bulkActions,
  emptyState,
  loading = false,
  loadingRows = 5,
  onRowClick,
  className = '',
  striped = false,
  hover = true,
  bordered = false,
}: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const [internalExpandedIds, setInternalExpandedIds] = useState<Set<string>>(new Set());
  
  // Use external or internal search query
  const searchQuery = externalSearchQuery ?? internalSearchQuery;
  
  // Use external or internal expanded IDs
  const expandedIds = externalExpandedIds ?? internalExpandedIds;
  
  // Handle search change
  const handleSearchChange = useCallback((query: string) => {
    if (onSearchChange) {
      onSearchChange(query);
    } else {
      setInternalSearchQuery(query);
    }
  }, [onSearchChange]);
  
  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFields || searchFields.length === 0) {
      return data;
    }
    
    const query = searchQuery.toLowerCase();
    return data.filter(row => {
      return searchFields.some(field => {
        const value = row[field];
        if (value === null || value === undefined) return false;
        return String(value).toLowerCase().includes(query);
      });
    });
  }, [data, searchQuery, searchFields]);
  
  // Handle row selection toggle
  const handleToggleRow = useCallback((id: string) => {
    if (!onSelectionChange) return;
    
    const newSelectedIds = new Set(selectedIds);
    if (newSelectedIds.has(id)) {
      newSelectedIds.delete(id);
    } else {
      newSelectedIds.add(id);
    }
    onSelectionChange(newSelectedIds);
  }, [selectedIds, onSelectionChange]);
  
  // Handle select all toggle
  const handleToggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    
    const allIds = filteredData.map((row, idx) => keyExtractor(row, idx));
    const allSelected = allIds.length > 0 && allIds.every(id => selectedIds.has(id));
    
    if (allSelected) {
      // Deselect all
      onSelectionChange(new Set());
    } else {
      // Select all
      onSelectionChange(new Set(allIds));
    }
  }, [filteredData, selectedIds, onSelectionChange, keyExtractor]);
  
  // Handle row expansion toggle
  const handleToggleExpanded = useCallback((id: string) => {
    if (onExpandChange) {
      onExpandChange(id);
    } else {
      const newExpandedIds = new Set(expandedIds);
      if (newExpandedIds.has(id)) {
        newExpandedIds.delete(id);
      } else {
        newExpandedIds.add(id);
      }
      setInternalExpandedIds(newExpandedIds);
    }
  }, [expandedIds, onExpandChange]);
  
  // Check if all rows are selected
  const allSelected = useMemo(() => {
    if (filteredData.length === 0) return false;
    const allIds = filteredData.map((row, idx) => keyExtractor(row, idx));
    return allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  }, [filteredData, selectedIds, keyExtractor]);
  
  // Check if some (but not all) rows are selected
  const someSelected = useMemo(() => {
    if (filteredData.length === 0 || allSelected) return false;
    const allIds = filteredData.map((row, idx) => keyExtractor(row, idx));
    return allIds.some(id => selectedIds.has(id));
  }, [filteredData, selectedIds, allSelected, keyExtractor]);
  
  // Get value from row using accessor
  const getCellValue = useCallback((row: T, column: Column<T>, index: number) => {
    if (typeof column.accessor === 'function') {
      return column.accessor(row, index);
    }
    return column?.accessor ? row[column?.accessor || ''] || row : row;
  }, []);
  
  // Calculate column count for expanded row colspan
  const totalColumns = useMemo(() => {
    let count = columns.length;
    if (selectable) count += 1;
    if (actions) count += 1;
    return count;
  }, [columns.length, selectable, actions]);
  
  // Show loading skeleton
  if (loading) {
    return (
      <div>
        {searchable && (
          <SearchInput
            placeholder={searchPlaceholder}
            onSearch={() => {}}
            loading={true}
          />
        )}
        <LoadingState variant="table" />
      </div>
    );
  }
  
  // Show empty state
  if (filteredData.length === 0 && !searchQuery) {
    return (
      <div>
        {searchable && (
          <SearchInput
            placeholder={searchPlaceholder}
            onSearch={handleSearchChange}
          />
        )}
        {emptyState || (
          <EmptyState
            icon="bi-inbox"
            heading="Sin datos"
            description="No hay información para mostrar"
          />
        )}
      </div>
    );
  }
  
  return (
    <div>
      {/* Search Input */}
      {searchable && (
        <div className="mb-3">
          <SearchInput
            placeholder={searchPlaceholder}
            onSearch={handleSearchChange}
          />
        </div>
      )}
      
      {/* Bulk Actions Bar */}
      {selectable && selectedIds.size > 0 && bulkActions && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`d-flex flex-col align-items-center gap-3 p-3 mb-3 bg-light rounded ${
            isMobile ? 'position-sticky bottom-0 shadow' : ''
          }`}
          style={isMobile ? { zIndex: 10 } : {}}
        >
          <span className="fw-bold text-primary">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? 's' : ''}
          </span>
          <div className="ms-auto d-flex gap-2">
            {bulkActions}
          </div>
        </motion.div>
      )}
      
      {/* Table */}
      <div className="table-responsive">
        <Table 
          hover={hover} 
          striped={striped} 
          bordered={bordered}
          className={`mb-0 ${className}`}
        >
          <thead className="table-light">
            <tr>
              {/* Selection Checkbox Column */}
              {selectable && (
                <th style={{ width: '50px' }} className="text-center">
                  <Input
                    type="checkbox"
                    checked={allSelected}
                    innerRef={(input: HTMLInputElement | null) => {
                      if (input) {
                        input.indeterminate = someSelected;
                      }
                    }}
                    onChange={handleToggleAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              
              {/* Data Columns */}
              {columns.map((column, idx) => (
                <th
                  key={idx}
                  style={{ width: column.width }}
                  className={`${column.className || ''} ${
                    column.mobileHidden ? 'd-none d-md-table-cell' : ''
                  } ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-end' : ''
                  }`}
                >
                  {column.header}
                </th>
              ))}
              
              {/* Actions Column */}
              {actions && (
                <th style={{ width: '120px' }}>Acciones</th>
              )}
            </tr>
          </thead>
          
          <tbody>
            {filteredData.map((row, index) => {
              const rowKey = keyExtractor(row, index);
              const isSelected = selectedIds.has(rowKey);
              const isExpanded = expandedIds.has(rowKey);
              
              return (
                <React.Fragment key={rowKey}>
                  {/* Main Row */}
                  <motion.tr
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => {
                      if (expandable && !isMobile) {
                        handleToggleExpanded(rowKey);
                      }
                      if (onRowClick) {
                        onRowClick(row, index);
                      }
                    }}
                    style={{ 
                      cursor: expandable || onRowClick ? 'pointer' : 'default',
                      backgroundColor: isSelected ? 'rgba(13, 110, 253, 0.05)' : undefined,
                    }}
                  >
                    {/* Selection Checkbox */}
                    {selectable && (
                      <td className="text-center align-middle">
                        <Input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(rowKey)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label={`Seleccionar fila ${index + 1}`}
                        />
                      </td>
                    )}
                    
                    {/* Data Cells */}
                    {columns.map((column, colIdx) => {
                      const value = getCellValue(row, column, index);
                      const content = column.render 
                        ? column.render(value, row, index)
                        : value;
                      
                      return (
                        <td
                          key={colIdx}
                          className={`align-middle ${column.className || ''} ${
                            column.mobileHidden ? 'd-none d-md-table-cell' : ''
                          } ${
                            column.align === 'center' ? 'text-center' : 
                            column.align === 'right' ? 'text-end' : ''
                          }`}
                        >
                          {content}
                        </td>
                      );
                    })}
                    
                    {/* Actions Cell */}
                    {actions && (
                      <td className="align-middle" onClick={(e) => e.stopPropagation()}>
                        {actions(row, index)}
                      </td>
                    )}
                  </motion.tr>
                  
                  {/* Expanded Row - Desktop (inline) */}
                  {expandable && isExpanded && !isMobile && renderExpandedRow && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <td colSpan={totalColumns} className="bg-light">
                        <div className="p-3">
                          {renderExpandedRow(row, index)}
                        </div>
                      </td>
                    </motion.tr>
                  )}
                  
                  {/* Expanded Row - Mobile (Dialog) */}
                  {expandable && isExpanded && isMobile && renderExpandedRow && (
                    <Dialog
                      isOpen={true}
                      onClose={() => handleToggleExpanded(rowKey)}
                      title="Detalles"
                    >
                      {renderExpandedRow(row, index)}
                    </Dialog>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </Table>
        
        {/* No Search Results */}
        {filteredData.length === 0 && searchQuery && (
          <div className="text-center py-4">
            <p className="text-muted mb-2">
              No se encontraron resultados para "{searchQuery}"
            </p>
            <button
              className="btn btn-link btn-sm"
              onClick={() => handleSearchChange('')}
            >
              Limpiar búsqueda
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;
