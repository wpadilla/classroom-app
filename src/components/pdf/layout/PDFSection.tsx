// PDFSection Component - Section with optional title and border
import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PDFSectionProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';
import { usePDFTheme } from '../core/PDFTemplate';

// IMPORTANT: Use explicit constants to prevent "Invalid border width: undefined" errors
const BORDER_WIDTH_NORMAL = 1;
const BORDER_COLOR_LIGHT = '#e2e8f0'; // blueGray[200]
const DEFAULT_MARGIN_BOTTOM = 16; // lg spacing

export const PDFSection: React.FC<PDFSectionProps> = ({
  title,
  children,
  border = false,
  backgroundColor,
  padding = 0,
  marginBottom,
}) => {
  const theme = usePDFTheme();

  const sectionStyle = {
    ...pdfStyles.section,
    ...(border && {
      borderWidth: BORDER_WIDTH_NORMAL,
      borderColor: BORDER_COLOR_LIGHT,
      borderRadius: 6,
    }),
    backgroundColor: backgroundColor || 'transparent',
    padding: padding,
    marginBottom: marginBottom !== undefined ? marginBottom : DEFAULT_MARGIN_BOTTOM,
  };

  return (
    <View style={sectionStyle}>
      {title && (
        typeof title === 'string' ? (
          <Text style={pdfStyles.sectionTitle}>{title}</Text>
        ) : (
          title
        )
      )}
      <View style={{ width: '100%' }}>
        {children}
      </View>
    </View>
  );
};

export default PDFSection;

