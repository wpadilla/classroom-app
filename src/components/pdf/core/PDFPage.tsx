// PDFPage Component - Page wrapper with pagination support
import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles } from '../styles/pdfStyles';
import { defaultPDFTheme } from '../styles/pdfTheme';

interface PDFPageProps {
  children: React.ReactNode;
  size?: 'A4' | 'LETTER' | 'LEGAL';
  orientation?: 'portrait' | 'landscape';
  style?: any;
  showPageNumber?: boolean;
  pageNumber?: number;
  footer?: React.ReactNode;
}

export const PDFPage: React.FC<PDFPageProps> = ({
  children,
  size = 'A4',
  orientation = 'portrait',
  style,
  showPageNumber = false,
  pageNumber,
  footer,
}) => {
  return (
    <Page size={size} orientation={orientation} style={[pdfStyles.page, style]}>
      <View style={{ flex: 1 }}>{children}</View>

      {(showPageNumber || footer) && (
        <View style={pdfStyles.footer}>
          {footer}
          {showPageNumber && pageNumber && (
            <Text style={pdfStyles.footerText}>Página {pageNumber}</Text>
          )}
        </View>
      )}
    </Page>
  );
};

export default PDFPage;

