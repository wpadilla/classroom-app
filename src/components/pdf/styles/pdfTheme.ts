// PDF Theme System - Design Tokens based on Material Tailwind
import { materialTailwindColors, MaterialColor, ColorShade, getColor } from './materialTailwindColors';

export interface PDFTheme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    // Material Tailwind colors
    gray: typeof materialTailwindColors.gray;
    blueGray: typeof materialTailwindColors['blue-gray'];
    blue: typeof materialTailwindColors.blue;
    red: typeof materialTailwindColors.red;
    green: typeof materialTailwindColors.green;
    amber: typeof materialTailwindColors.amber;
    cyan: typeof materialTailwindColors.cyan;
    purple: typeof materialTailwindColors.purple;
    pink: typeof materialTailwindColors.pink;
    indigo: typeof materialTailwindColors.indigo;
    teal: typeof materialTailwindColors.teal;
    lime: typeof materialTailwindColors.lime;
    orange: typeof materialTailwindColors.orange;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
      '2xl': number;
      '3xl': number;
      '4xl': number;
    };
    fontWeight: {
      normal: number | string;
      medium: number | string;
      semibold: number | string;
      bold: number | string;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    '2xl': number;
    '3xl': number;
  };
  borderRadius: {
    none: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  borders: {
    width: {
      thin: number;
      normal: number;
      thick: number;
    };
    color: {
      light: string;
      normal: string;
      dark: string;
    };
  };
}

export const defaultPDFTheme: PDFTheme = {
  colors: {
    primary: getColor('blue', 500),
    secondary: getColor('gray', 500),
    success: getColor('green', 500),
    warning: getColor('amber', 500),
    error: getColor('red', 500),
    info: getColor('cyan', 500),
    // Material Tailwind colors
    gray: materialTailwindColors.gray,
    blueGray: materialTailwindColors['blue-gray'],
    blue: materialTailwindColors.blue,
    red: materialTailwindColors.red,
    green: materialTailwindColors.green,
    amber: materialTailwindColors.amber,
    cyan: materialTailwindColors.cyan,
    purple: materialTailwindColors.purple,
    pink: materialTailwindColors.pink,
    indigo: materialTailwindColors.indigo,
    teal: materialTailwindColors.teal,
    lime: materialTailwindColors.lime,
    orange: materialTailwindColors.orange,
  },
  typography: {
    fontFamily: 'Helvetica',
    fontSize: {
      xs: 10,
      sm: 12,
      base: 14,
      lg: 16,
      xl: 18,
      '2xl': 20,
      '3xl': 24,
      '4xl': 28,
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 'bold',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.8,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 32,
  },
  borderRadius: {
    none: 0,
    sm: 2,
    md: 5,
    lg: 8,
    xl: 12,
    full: 9999,
  },
  borders: {
    width: {
      thin: 0.5,
      normal: 1,
      thick: 2,
    },
    color: {
      light: materialTailwindColors.gray[200],
      normal: materialTailwindColors.gray[300],
      dark: materialTailwindColors.gray[400],
    },
  },
};

// Utility function to create custom themes
export const createPDFTheme = (overrides: Partial<PDFTheme>): PDFTheme => {
  return {
    ...defaultPDFTheme,
    ...overrides,
    colors: {
      ...defaultPDFTheme.colors,
      ...overrides.colors,
    },
    typography: {
      ...defaultPDFTheme.typography,
      ...overrides.typography,
      fontSize: {
        ...defaultPDFTheme.typography.fontSize,
        ...overrides.typography?.fontSize,
      },
      fontWeight: {
        ...defaultPDFTheme.typography.fontWeight,
        ...overrides.typography?.fontWeight,
      },
      lineHeight: {
        ...defaultPDFTheme.typography.lineHeight,
        ...overrides.typography?.lineHeight,
      },
    },
    spacing: {
      ...defaultPDFTheme.spacing,
      ...overrides.spacing,
    },
    borderRadius: {
      ...defaultPDFTheme.borderRadius,
      ...overrides.borderRadius,
    },
    borders: {
      ...defaultPDFTheme.borders,
      ...overrides.borders,
      width: {
        ...defaultPDFTheme.borders.width,
        ...overrides.borders?.width,
      },
      color: {
        ...defaultPDFTheme.borders.color,
        ...overrides.borders?.color,
      },
    },
  };
};

// Export Material Tailwind colors for component-level color customization
export { materialTailwindColors, getColor };
export type { MaterialColor, ColorShade };

