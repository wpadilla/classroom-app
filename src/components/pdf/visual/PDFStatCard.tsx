// PDFStatCard Component - StatisticsCard-inspired card for PDFs
import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PDFStatCardProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';
import { getColor, materialTailwindColors } from '../styles/pdfTheme';
import { usePDFTheme } from '../core/PDFTemplate';

// Use explicit constants for spacing and typography
const SPACING_XS = 4;
const SPACING_SM = 8;
const FONT_SIZE_XS = 10;
const TEXT_COLOR_MUTED = '#64748b'; // blueGray[500]

export const PDFStatCard: React.FC<PDFStatCardProps> = ({
  icon,
  title,
  value,
  color = 'blue',
  footer,
  iconBackgroundColor,
  iconSize = 48,
}) => {
  const theme = usePDFTheme();

  // Determine background color for icon
  const bgColor = iconBackgroundColor ||
    (typeof color === 'string' && color in materialTailwindColors
      ? getColor(color as any, 500)
      : color);

  return (
    <View style={{
      ...pdfStyles.statCard,
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    }}>
      {/* Icon Section */}
      {icon && (
        <View
          style={{
            ...pdfStyles.statCardIcon,
            backgroundColor: bgColor,
            width: iconSize,
            height: iconSize,
            marginBottom: SPACING_SM,
          }}
        >
          {icon}
        </View>
      )}

      {/* Value and Title */}
      <View style={{ width: '100%' }}>
        {value && (
          typeof value === 'string' || typeof value === 'number' ? (
            <Text style={{
              ...pdfStyles.statCardValue,
              marginBottom: SPACING_XS,
            }}>{value}</Text>
          ) : (
            value
          )
        )}
        {title && (
          typeof title === 'string' ? (
            <Text style={pdfStyles.statCardLabel}>{title}</Text>
          ) : (
            title
          )
        )}
      </View>

      {/* Footer */}
      {footer && (
        <View style={{ marginTop: SPACING_SM, width: '100%' }}>
          {typeof footer === 'string' ? (
            <Text
              style={{
                fontSize: FONT_SIZE_XS,
                color: TEXT_COLOR_MUTED,
              }}
            >
              {footer}
            </Text>
          ) : (
            footer
          )}
        </View>
      )}
    </View>
  );
};

export default PDFStatCard;

