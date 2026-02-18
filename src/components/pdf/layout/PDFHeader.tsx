// PDFHeader Component - Header with logo, title, and metadata
import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { PDFHeaderProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';
import { getImageSource } from '../utils/pdfHelpers';
import { usePDFTheme } from '../core/PDFTemplate';

// IMPORTANT: Use explicit numeric values to prevent "Invalid border width: undefined" errors
const BORDER_WIDTH_NORMAL = 1;
const BORDER_COLOR_LIGHT = '#e0e0e0';
const SPACING_SM = 8;
const SPACING_MD = 12;

export const PDFHeader: React.FC<PDFHeaderProps> = ({
  logo,
  title,
  subtitle,
  metadata,
  backgroundColor,
  borderBottom = true,
  logoSize = { width: 90, height: 90 },
}) => {
  const theme = usePDFTheme();
  const logoSrc = logo ? getImageSource(logo) : undefined;

  return (
    <View
      style={{
        ...pdfStyles.titleContainer,
        backgroundColor: backgroundColor || 'transparent',
        ...(borderBottom && {
          borderBottomWidth: BORDER_WIDTH_NORMAL,
          borderBottomColor: BORDER_COLOR_LIGHT,
        }),
        paddingBottom: SPACING_MD,
      }}
    >
      {logoSrc && (
        <Image
          src={logoSrc}
          style={{
            ...pdfStyles.logo,
            width: logoSize.width,
            height: logoSize.height,
          }}
        />
      )}
      <View style={{ flex: 1 }}>
        {typeof title === 'string' ? (
          <Text style={pdfStyles.title}>{title}</Text>
        ) : (
          title
        )}
        {subtitle && (
          typeof subtitle === 'string' ? (
            <Text style={pdfStyles.subtitle}>{subtitle}</Text>
          ) : (
            subtitle
          )
        )}
        {metadata && Object.keys(metadata).length > 0 && (
          <View style={{ marginTop: SPACING_SM }}>
            {Object.entries(metadata).map(([key, value], index) => (
              <View key={index} style={pdfStyles.row}>
                <Text style={pdfStyles.label}>{key}:</Text>
                <Text style={pdfStyles.value}>
                  {typeof value === 'string' || typeof value === 'number' ? value : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

export default PDFHeader;

