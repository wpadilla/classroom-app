// PDFDocument Component - Document wrapper with metadata
import React from 'react';
import { Document } from '@react-pdf/renderer';
import { PDFDocumentConfig, PDFMetadata } from '../utils/pdfConfig.types';
import PDFTemplate from './PDFTemplate';
import PDFPage from './PDFPage';

interface PDFDocumentProps {
  children: React.ReactNode;
  metadata?: PDFMetadata;
  config?: Partial<PDFDocumentConfig>;
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
  orientation?: 'portrait' | 'landscape';
  context?: any;
}

/**
 * PDFDocument - Root component for PDF generation
 * Wraps content with Document, Template, and Page components
 */
export const PDFDocument: React.FC<PDFDocumentProps> = ({
  children,
  metadata,
  config,
  pageSize = 'A4',
  orientation = 'portrait',
  context,
}) => {
  const docMetadata = metadata || config?.metadata || {};

  return (
    <Document
      title={docMetadata.title}
      author={docMetadata.author}
      subject={docMetadata.subject}
      keywords={docMetadata.keywords}
      creator={docMetadata.creator || 'TravelM PDF Generator'}
      producer={docMetadata.producer || 'TravelM'}
    >
      <PDFTemplate config={config} context={context}>
        <PDFPage size={pageSize} orientation={orientation}>
          {children}
        </PDFPage>
      </PDFTemplate>
    </Document>
  );
};

export default PDFDocument;

