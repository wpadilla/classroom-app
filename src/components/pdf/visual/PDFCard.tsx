// PDFCard Component - InfoCardItem-inspired card for PDFs
import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { PDFCardProps } from '../utils/pdfConfig.types';
import { pdfStyles } from '../styles/pdfStyles';
import { getImageSource } from '../utils/pdfHelpers';
import { usePDFTheme } from '../core/PDFTemplate';

// IMPORTANT: Use explicit numeric values to prevent "Invalid border width: undefined" errors
const BORDER_WIDTH_NORMAL = 1;
const BORDER_RADIUS_MD = 5;
const BORDER_RADIUS_SM = 2;
const SPACING_XS = 4;
const SPACING_SM = 8;
const SPACING_MD = 12;
const FONT_SIZE_SM = 12;
const FONT_SIZE_XS = 10;
const TEXT_COLOR = '#475569'; // blueGray[600]
const PRIMARY_COLOR = '#3b82f6';

export const PDFCard: React.FC<PDFCardProps> = ({
  title,
  subtitle,
  description,
  image,
  images,
  actions,
  border = true,
  backgroundColor,
  padding,
}) => {
  const theme = usePDFTheme();
  const imageSrc = image ? getImageSource(image) : undefined;
  const imageSources = images?.map((img) => getImageSource(img)).filter(Boolean) || [];

  return (
    <View
      style={{
        ...pdfStyles.card,
        ...(border && { borderWidth: BORDER_WIDTH_NORMAL }),
        backgroundColor: backgroundColor || '#fff',
        padding: padding !== undefined ? padding : SPACING_MD,
      }}
    >
      {/* Card Header with Image */}
      {(imageSrc || imageSources.length > 0) && (
        <View style={pdfStyles.cardHeader}>
          {imageSrc && (
            <Image
              src={imageSrc}
              style={{
                width: '100%',
                height: 120,
                objectFit: 'cover',
                borderRadius: BORDER_RADIUS_MD,
              }}
            />
          )}
          {imageSources.length > 0 && !imageSrc && (
            <View style={{ flexDirection: 'row', gap: SPACING_XS, flexWrap: 'wrap' }}>
              {imageSources.slice(0, 3).map((src, index) => (
                <Image
                  key={index}
                  src={src}
                  style={{
                    width: imageSources.length === 1 ? '100%' : '48%',
                    height: 80,
                    objectFit: 'cover',
                    borderRadius: BORDER_RADIUS_SM,
                  }}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* Card Body */}
      <View style={pdfStyles.cardBody}>
        {subtitle && (
          typeof subtitle === 'string' ? (
            <Text style={pdfStyles.cardSubtitle}>{subtitle}</Text>
          ) : (
            subtitle
          )
        )}
        {title && (
          typeof title === 'string' ? (
            <Text style={pdfStyles.cardTitle}>{title}</Text>
          ) : (
            title
          )
        )}
        {description && (
          <View style={{ marginTop: SPACING_XS }}>
            {typeof description === 'string' ? (
              <Text
                style={{
                  fontSize: FONT_SIZE_SM,
                  color: TEXT_COLOR,
                }}
              >
                {description}
              </Text>
            ) : (
              description
            )}
          </View>
        )}
      </View>

      {/* Card Footer with Actions */}
      {actions && actions.length > 0 && (
        <View style={pdfStyles.cardFooter}>
          {actions.map((action, index) => (
            <Text
              key={index}
              style={{
                fontSize: FONT_SIZE_XS,
                color: PRIMARY_COLOR,
                marginRight: SPACING_SM,
              }}
            >
              • {action}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

export default PDFCard;

