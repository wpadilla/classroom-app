// PDFList Component - Bullet or numbered lists
import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PDFListProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';
import { usePDFTheme } from '../core/PDFTemplate';

// Use explicit constants for theme values
const DEFAULT_FONT_SIZE = 12;
const DEFAULT_SPACING = 8;
const DEFAULT_TEXT_COLOR = '#334155'; // blueGray[700]

export const PDFList: React.FC<PDFListProps> = ({
  items,
  type = 'bullet',
  icon,
  fontSize,
  color,
}) => {
  const theme = usePDFTheme();

  return (
    <View style={pdfStyles.list}>
      {items.map((item, index) => (
        <View key={index} style={pdfStyles.listItem}>
          {type === 'numbered' && (
            <Text
              style={{
                ...pdfStyles.listNumber,
                fontSize: fontSize || DEFAULT_FONT_SIZE,
              }}
            >
              {index + 1}.
            </Text>
          )}
          {type === 'bullet' && !icon && (
            <View style={pdfStyles.listBullet} />
          )}
          {icon && <View style={{ marginRight: DEFAULT_SPACING }}>{icon}</View>}
          <Text
            style={{
              ...pdfStyles.listText,
              fontSize: fontSize || DEFAULT_FONT_SIZE,
              color: color || DEFAULT_TEXT_COLOR,
            }}
          >
            {typeof item === 'string' ? item : ''}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default PDFList;

