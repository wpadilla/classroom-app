// PDFKeyValue Component - Key-value pairs display
import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { PDFKeyValueProps } from '../utils/pdfConfig.types';

// IMPORTANT: Use explicit constants to prevent "Invalid border width: undefined" errors
const BORDER_WIDTH_THIN = 0.5;
const BORDER_COLOR_LIGHT = '#f1f5f9'; // blueGray[100]
const LABEL_COLOR = '#1e293b'; // blueGray[800]
const VALUE_COLOR = '#475569'; // blueGray[600]

export const PDFKeyValue: React.FC<PDFKeyValueProps> = ({
  data,
  labelWidth = '40%',
  valueColor,
  labelColor,
  fontSize,
  spacing,
}) => {
  return (
    <View style={{ width: '100%' }}>
      {Object.entries(data).map(([key, value], index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            marginBottom: spacing !== undefined ? spacing : 6,
            paddingVertical: 4,
            borderBottomWidth: BORDER_WIDTH_THIN,
            borderBottomColor: BORDER_COLOR_LIGHT,
          }}
        >
          <Text
            style={{
              width: labelWidth,
              fontSize: fontSize || 10,
              fontWeight: 'bold',
              color: labelColor || LABEL_COLOR,
              paddingRight: 8,
            }}
          >
            {key}:
          </Text>
          <Text
            style={{
              flex: 1,
              fontSize: fontSize || 10,
              color: valueColor || VALUE_COLOR,
            }}
          >
            {typeof value === 'string' || typeof value === 'number' ? value : ''}
          </Text>
        </View>
      ))}
    </View>
  );
};

export default PDFKeyValue;
