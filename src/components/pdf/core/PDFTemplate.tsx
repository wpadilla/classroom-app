// PDFTemplate Component - Main template wrapper with theme context
import React, { createContext, useContext } from 'react';
import { PDFTemplateProps, PDFTemplateContext } from '../utils/pdfConfig.types';
import { defaultPDFTheme, PDFTheme } from '../styles/pdfTheme';

// Create context for theme
const PDFThemeContext = createContext<PDFTheme>(defaultPDFTheme);

// Hook to use theme in child components - always returns a valid theme
export const usePDFTheme = (): PDFTheme => {
  const theme = useContext(PDFThemeContext);
  // Ensure theme and all required properties exist with proper fallbacks
  return {
    ...defaultPDFTheme,
    ...theme,
    colors: {
      ...defaultPDFTheme.colors,
      ...theme?.colors,
    },
    typography: {
      ...defaultPDFTheme.typography,
      ...theme?.typography,
      fontSize: {
        ...defaultPDFTheme.typography.fontSize,
        ...theme?.typography?.fontSize,
      },
      fontWeight: {
        ...defaultPDFTheme.typography.fontWeight,
        ...theme?.typography?.fontWeight,
      },
      lineHeight: {
        ...defaultPDFTheme.typography.lineHeight,
        ...theme?.typography?.lineHeight,
      },
    },
    spacing: {
      ...defaultPDFTheme.spacing,
      ...theme?.spacing,
    },
    borderRadius: {
      ...defaultPDFTheme.borderRadius,
      ...theme?.borderRadius,
    },
    borders: {
      ...defaultPDFTheme.borders,
      ...theme?.borders,
      width: {
        ...defaultPDFTheme.borders.width,
        ...theme?.borders?.width,
      },
      color: {
        ...defaultPDFTheme.borders.color,
        ...theme?.borders?.color,
      },
    },
  };
};

// Create context for template data
const PDFTemplateDataContext = createContext<PDFTemplateContext>({});

// Hook to use template data in child components
export const usePDFTemplateData = () => useContext(PDFTemplateDataContext);

/**
 * PDFTemplate - Main wrapper component for PDF generation
 * Provides theme and context to all child components
 */
export const PDFTemplate: React.FC<PDFTemplateProps> = ({
  children,
  context = {},
  config,
}) => {
  // Merge custom theme with default theme, ensuring all properties are preserved
  const theme: PDFTheme = config?.theme
    ? {
        ...defaultPDFTheme,
        colors: {
          ...defaultPDFTheme.colors,
          primary: config.theme.primaryColor || defaultPDFTheme.colors.primary,
          secondary: config.theme.secondaryColor || defaultPDFTheme.colors.secondary,
        },
        typography: {
          ...defaultPDFTheme.typography,
          fontFamily: config.theme.fontFamily || defaultPDFTheme.typography.fontFamily,
          fontSize: {
            ...defaultPDFTheme.typography.fontSize,
            base: config.theme.fontSize || defaultPDFTheme.typography.fontSize.base,
          },
          fontWeight: defaultPDFTheme.typography.fontWeight,
          lineHeight: defaultPDFTheme.typography.lineHeight,
        },
        spacing: defaultPDFTheme.spacing,
        borderRadius: defaultPDFTheme.borderRadius,
        borders: defaultPDFTheme.borders,
      }
    : defaultPDFTheme;

  const templateContext: PDFTemplateContext = {
    ...context,
    metadata: config?.metadata || context.metadata,
  };

  return (
    <PDFThemeContext.Provider value={theme}>
      <PDFTemplateDataContext.Provider value={templateContext}>
        {children}
      </PDFTemplateDataContext.Provider>
    </PDFThemeContext.Provider>
  );
};

export default PDFTemplate;

