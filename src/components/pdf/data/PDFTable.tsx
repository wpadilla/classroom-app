// PDFTable Component - DataTable-inspired table for PDFs
import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PDFTableProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';
import { getNestedValue } from '../utils/pdfHelpers';
import { usePDFTheme } from '../core/PDFTemplate';

// IMPORTANT: Use explicit constants to prevent "Invalid border width: undefined" errors
const BORDER_WIDTH_NORMAL = 1;
const BORDER_WIDTH_THIN = 0.5;
const BORDER_WIDTH_THICK = 2;
const BORDER_COLOR_LIGHT = '#e2e8f0'; // blueGray[200]
const BORDER_COLOR_MEDIUM = '#3b82f6'; // blue[500]
const BORDER_COLOR_DARK = '#2563eb'; // blue[600]
const BG_STRIPE = '#f8fafc'; // blueGray[50]
const TEXT_COLOR = '#334155'; // blueGray[700]

export function PDFTable<T = any>({
  columns,
  data,
  stripe = true,
  headerColor,
  headerTextColor,
  border = true,
  cellPadding,
  fontSize,
}: PDFTableProps<T>) {
  const theme = usePDFTheme();

  const renderCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object' && value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // Calculate if we're using percentage widths
  const hasPercentageWidths = columns.some(col => typeof col.width === 'string' && col.width.includes('%'));

  return (
    <View
      style={{
        ...pdfStyles.table,
        ...(border && {
          borderWidth: BORDER_WIDTH_NORMAL,
          borderColor: BORDER_COLOR_LIGHT,
        }),
      }}
    >
      {/* Table Header */}
      <View
        style={{
          ...pdfStyles.tableHeader,
          backgroundColor: headerColor || BORDER_COLOR_MEDIUM,
          borderBottomWidth: BORDER_WIDTH_THICK,
          borderBottomColor: BORDER_COLOR_DARK,
        }}
      >
        {columns.map((column, index) => (
          <View
            key={index}
            style={{
              width: column.width || `${100 / columns.length}%`,
              paddingHorizontal: cellPadding || 8,
              paddingVertical: cellPadding || 10,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: fontSize || 10,
                fontWeight: 'bold',
                color: headerTextColor || '#FFFFFF',
                textAlign: column.align || 'left',
              }}
            >
              {column.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Table Body */}
      {data.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            backgroundColor: stripe && rowIndex % 2 === 1
              ? BG_STRIPE
              : '#FFFFFF',
            borderBottomWidth: BORDER_WIDTH_THIN,
            borderBottomColor: BORDER_COLOR_LIGHT,
            minHeight: 35,
          }}
        >
          {columns.map((column, colIndex) => {
            const value = getNestedValue(row, column.key);
            const displayValue = column.render
              ? column.render(value, row, rowIndex)
              : renderCellValue(value);

            return (
              <View
                key={colIndex}
                style={{
                  width: column.width || `${100 / columns.length}%`,
                  paddingHorizontal: cellPadding || 8,
                  paddingVertical: cellPadding || 8,
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize || 9,
                    color: TEXT_COLOR,
                    textAlign: column.align || 'left',
                  }}
                >
                  {typeof displayValue === 'string' ? displayValue : ''}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export default PDFTable;

