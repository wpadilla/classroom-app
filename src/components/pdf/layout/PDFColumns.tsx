// PDFColumns Component - Multi-column layout
import React from 'react';
import { View } from '@react-pdf/renderer';
import { PDFColumnsProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';

// Use explicit constant for default gap
const DEFAULT_GAP = 12; // md spacing

export const PDFColumns: React.FC<PDFColumnsProps> = ({
  columns = 2,
  gap,
  children,
}) => {
  const columnGap = gap !== undefined ? gap : DEFAULT_GAP;

  // Convert children to array
  const childrenArray = React.Children.toArray(children);

  return (
    <View
      style={{
        ...pdfStyles.columnsContainer,
        gap: columnGap,
      }}
    >
      {childrenArray.map((child, index) => (
        <View
          key={index}
          style={{
            ...pdfStyles.column,
            width: `${100 / columns}%`,
          }}
        >
          {child}
        </View>
      ))}
    </View>
  );
};

export default PDFColumns;
