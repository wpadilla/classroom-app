// PDFGrid Component - Grid layout for cards and items
import React from 'react';
import { View } from '@react-pdf/renderer';
import { PDFGridProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';

// Use explicit constant for default gap
const DEFAULT_GAP = 12; // md spacing

export const PDFGrid: React.FC<PDFGridProps> = ({
  columns = 2,
  gap,
  children,
}) => {
  const gridGap = gap !== undefined ? gap : DEFAULT_GAP;
  const childrenArray = React.Children.toArray(children);

  // Calculate number of rows
  const rows = Math.ceil(childrenArray.length / columns);

  return (
    <View style={pdfStyles.grid}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            marginBottom: gridGap,
            width: '100%',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => {
            const itemIndex = rowIndex * columns + colIndex;
            const child = childrenArray[itemIndex];

            return (
              <View
                key={colIndex}
                style={{
                  flex: 1,
                  marginRight: colIndex < columns - 1 ? gridGap : 0,
                }}
              >
                {child || <View />}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

export default PDFGrid;
