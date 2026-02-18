// PDFBadge Component - Status badges for PDFs
import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PDFBadgeProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';
import { usePDFTheme } from '../core/PDFTemplate';

// Use explicit color constants as fallbacks
const COLORS = {
  primary: '#3b82f6',   // blue[500]
  secondary: '#6b7280', // gray[500]
  success: '#22c55e',   // green[500]
  warning: '#f59e0b',   // amber[500]
  error: '#ef4444',     // red[500]
  info: '#06b6d4',      // cyan[500]
};
const FONT_SIZE_XS = 10;

export const PDFBadge: React.FC<PDFBadgeProps> = ({
  text,
  variant = 'primary',
  backgroundColor,
  textColor,
  fontSize,
}) => {
  const theme = usePDFTheme();

  // Determine colors based on variant
  let bgColor = backgroundColor;
  let color = textColor || '#fff';

  if (!backgroundColor) {
    switch (variant) {
      case 'primary':
        bgColor = COLORS.primary;
        break;
      case 'success':
        bgColor = COLORS.success;
        break;
      case 'warning':
        bgColor = COLORS.warning;
        break;
      case 'error':
        bgColor = COLORS.error;
        break;
      case 'info':
        bgColor = COLORS.info;
        break;
      case 'secondary':
        bgColor = COLORS.secondary;
        break;
      default:
        bgColor = COLORS.primary;
    }
  }

  return (
    <View
      style={{
        ...pdfStyles.badge,
        backgroundColor: bgColor,
        flexDirection: 'row',
        alignSelf: 'flex-start',
      }}
    >
      <Text
        style={{
          color,
          fontSize: fontSize || FONT_SIZE_XS,
          fontWeight: 'bold',
        }}
      >
        {text}
      </Text>
    </View>
  );
};

export default PDFBadge;

