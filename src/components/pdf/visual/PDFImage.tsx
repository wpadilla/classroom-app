// PDFImage Component - Enhanced image component for PDFs
import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { PDFImageProps } from '../utils/pdfConfig.types';
import { getImageSource } from '../utils/pdfHelpers';
import { pdfStyles } from '../styles/pdfStyles';

// Use explicit constants
const BORDER_RADIUS_MD = 5;
const FONT_SIZE_XS = 10;
const SPACING_XS = 4;
const TEXT_COLOR_MUTED = '#64748b'; // blueGray[500]

export const PDFImage: React.FC<PDFImageProps> = ({
  src,
  alt,
  width,
  height,
  borderRadius,
  caption,
}) => {
  const imageSrc = getImageSource(src);

  if (!imageSrc) {
    return null;
  }

  return (
    <View style={pdfStyles.imageContainer}>
      <Image
        src={imageSrc}
        style={{
          ...pdfStyles.image,
          width: width || '100%',
          height: height || 'auto',
          borderRadius: borderRadius !== undefined ? borderRadius : BORDER_RADIUS_MD,
        }}
      />
      {caption && (
        <Text
          style={{
            fontSize: FONT_SIZE_XS,
            color: TEXT_COLOR_MUTED,
            marginTop: SPACING_XS,
            textAlign: 'center',
          }}
        >
          {caption}
        </Text>
      )}
    </View>
  );
};

export default PDFImage;
