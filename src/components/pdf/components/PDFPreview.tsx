import React from 'react';
import { PDFViewer } from '@react-pdf/renderer';

interface PDFPreviewProps {
  template: React.ComponentType<any>;
  templateProps: any;
  className?: string;
  width?: string | number;
  height?: string | number;
  showToolbar?: boolean;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  template: Template,
  templateProps,
  className,
  width = '100%',
  height = '100%',
  showToolbar = false,
}) => {
  return (
    <PDFViewer
      width={width}
      height={height}
      className={className}
      showToolbar={showToolbar}
      style={{ border: 'none', borderRadius: '8px' }}
    >
      <Template {...templateProps} />
    </PDFViewer>
  );
};
