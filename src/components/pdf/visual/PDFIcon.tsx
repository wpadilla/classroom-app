// PDFIcon Component - Icon wrapper for PDFs
// Note: react-icons cannot be directly rendered in PDFs, this is a placeholder
// Icons should be converted to images or SVGs before use
import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PDFIconProps } from '../utils/pdfConfig.types';

// Use explicit constant for default color
const DEFAULT_COLOR = '#3b82f6'; // blue[500]

export const PDFIcon: React.FC<PDFIconProps> = ({
  name,
  size = 16,
  color,
}) => {
  // Since react-icons don't work directly in PDFs,
  // we show the icon name as text for now
  // In production, icons should be converted to images or SVG paths
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color || DEFAULT_COLOR,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: size / 2,
          color: '#fff',
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Text>
    </View>
  );
};

export default PDFIcon;

