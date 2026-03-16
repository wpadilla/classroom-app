// PDFFooter Component - Footer with page numbers and copyright
import React from 'react';
import { View, Text, Link } from '@react-pdf/renderer';
import { PDFFooterProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';

// IMPORTANT: Use explicit numeric values to prevent "Invalid border width: undefined" errors
const BORDER_WIDTH_NORMAL = 1;
const SPACING_MD = 12;

export const PDFFooter: React.FC<PDFFooterProps> = ({
  text,
  pageNumbers = true,
  links,
  copyright,
  borderTop = true,
}) => {
  return (
    <View
      style={{
        ...pdfStyles.footer,
        ...(borderTop && { borderTopWidth: BORDER_WIDTH_NORMAL }),
      }}
    >
      {text && (
        typeof text === 'string' ? (
          <Text style={pdfStyles.footerText}>{text}</Text>
        ) : (
          text
        )
      )}

      {links && links.length > 0 && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING_MD }}>
          {links.map((link, index) => (
            <Link key={index} src={link.url} style={pdfStyles.footerText}>
              {link.label}
            </Link>
          ))}
        </View>
      )}

      {copyright && (
        <Text style={pdfStyles.footerText}>{copyright}</Text>
      )}
    </View>
  );
};

export default PDFFooter;
