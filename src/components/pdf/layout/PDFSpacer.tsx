// PDFSpacer Component - Simple spacing utility
import React from 'react';
import { View } from '@react-pdf/renderer';
import { PDFSpacerProps } from '../utils/pdfConfig.types';

// Use explicit constant for default height
const DEFAULT_SPACER_HEIGHT = 12;

export const PDFSpacer: React.FC<PDFSpacerProps> = ({ height }) => {
  const spacerHeight = height !== undefined ? height : DEFAULT_SPACER_HEIGHT;

  return <View style={{ height: spacerHeight }} />;
};

export default PDFSpacer;

