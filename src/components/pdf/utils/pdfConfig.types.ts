// TypeScript interfaces for PDF configuration system
import { ReactNode } from 'react';
import { ChartType, ChartData, ChartOptions } from 'chart.js';
import { MaterialColor, ColorShade } from '../styles/pdfTheme';

// Local IMedia interface (stub for PDF system)
interface IMedia {
  url: string;
  name?: string;
  type?: string;
}

// ==================== Core Configuration ====================

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
}

export interface PDFThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  fontSize?: number;
}

export interface PDFDocumentConfig {
  metadata?: PDFMetadata;
  theme?: PDFThemeConfig;
  pageSize?: 'A4' | 'LETTER' | 'LEGAL';
  orientation?: 'portrait' | 'landscape';
  layout: PDFLayoutConfig[];
}

// ==================== Layout Configuration ====================

export type PDFComponentType =
  | 'header'
  | 'footer'
  | 'section'
  | 'columns'
  | 'spacer'
  | 'table'
  | 'list'
  | 'keyValue'
  | 'grid'
  | 'card'
  | 'statCard'
  | 'chart'
  | 'image'
  | 'badge'
  | 'text';

export interface PDFLayoutConfig {
  type: PDFComponentType;
  props: Record<string, any>;
  children?: PDFLayoutConfig[];
}

// ==================== Header & Footer ====================

export interface PDFHeaderProps {
  logo?: IMedia | string;
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  metadata?: PDFKeyValueData;
  backgroundColor?: string;
  borderBottom?: boolean;
  logoSize?: { width: number; height: number };
}

export interface PDFFooterProps {
  text?: string | ReactNode;
  pageNumbers?: boolean;
  links?: { label: string; url: string }[];
  copyright?: string;
  borderTop?: boolean;
}

// ==================== Layout Components ====================

export interface PDFSectionProps {
  title?: string | ReactNode;
  children?: ReactNode;
  border?: boolean;
  backgroundColor?: string;
  padding?: number;
  marginBottom?: number;
}

export interface PDFColumnsProps {
  columns: number;
  gap?: number;
  children: ReactNode;
}

export interface PDFSpacerProps {
  height?: number;
}

// ==================== Data Components ====================

export interface PDFTableColumn<T = any> {
  key: string;
  label: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => string | ReactNode;
}

export interface PDFTableProps<T = any> {
  columns: PDFTableColumn<T>[];
  data: T[];
  stripe?: boolean;
  headerColor?: string;
  headerTextColor?: string;
  border?: boolean;
  cellPadding?: number;
  fontSize?: number;
}

export type PDFListType = 'bullet' | 'numbered' | 'none';

export interface PDFListProps {
  items: (string | ReactNode)[];
  type?: PDFListType;
  icon?: ReactNode;
  fontSize?: number;
  color?: string;
}

export type PDFKeyValueData = Record<string, string | number | ReactNode>;

export interface PDFKeyValueProps {
  data: PDFKeyValueData;
  labelWidth?: number | string;
  valueColor?: string;
  labelColor?: string;
  fontSize?: number;
  spacing?: number;
}

export interface PDFGridProps {
  columns: number;
  gap?: number;
  children: ReactNode;
}

// ==================== Visual Components ====================

export interface PDFCardProps {
  title?: string | ReactNode;
  subtitle?: string | ReactNode;
  description?: string | ReactNode;
  image?: IMedia | string;
  images?: (IMedia | string)[];
  actions?: string[];
  border?: boolean;
  backgroundColor?: string;
  padding?: number;
}

export interface PDFStatCardProps {
  icon?: ReactNode;
  title?: string | ReactNode;
  value?: string | number | ReactNode;
  color?: MaterialColor | string;
  footer?: string | ReactNode;
  iconBackgroundColor?: string;
  iconSize?: number;
}

export interface PDFChartProps {
  type: ChartType;
  data: ChartData;
  options?: ChartOptions;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
}

export interface PDFImageProps {
  src: IMedia | string;
  alt?: string;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  caption?: string;
}

export interface PDFIconProps {
  name: string;
  size?: number;
  color?: string;
}

export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export interface PDFBadgeProps {
  text: string;
  variant?: BadgeVariant;
  backgroundColor?: string;
  textColor?: string;
  fontSize?: number;
}

// ==================== Utility Types ====================

export interface PDFTextProps {
  children: ReactNode;
  fontSize?: number;
  fontWeight?: number | string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  marginBottom?: number;
}

// ==================== Chart Conversion ====================

export interface ChartImageOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  devicePixelRatio?: number;
}

export interface ChartImageResult {
  base64: string;
  width: number;
  height: number;
}

// ==================== Template Configuration ====================

export interface PDFTemplateContext {
  theme?: PDFThemeConfig;
  metadata?: PDFMetadata;
  user?: any;
  organization?: any;
}

export interface PDFTemplateProps {
  children: ReactNode;
  context?: PDFTemplateContext;
  config?: Partial<PDFDocumentConfig>;
}

// ==================== Helper Types ====================

export type ColorValue = string | MaterialColor;

export interface Spacing {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface Border {
  width?: number;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

// ==================== Export Everything ====================

export type {
  ChartType,
  ChartData,
  ChartOptions,
} from 'chart.js';

