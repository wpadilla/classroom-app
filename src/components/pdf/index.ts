// PDF System - Main export file
// Import all components for easy access

// Core Components
export { PDFDocument } from './core/PDFDocument';
export { PDFTemplate, usePDFTheme, usePDFTemplateData } from './core/PDFTemplate';
export { PDFPage } from './core/PDFPage';

// Layout Components
export { PDFHeader } from './layout/PDFHeader';
export { PDFFooter } from './layout/PDFFooter';
export { PDFSection } from './layout/PDFSection';
export { PDFColumns } from './layout/PDFColumns';
export { PDFSpacer } from './layout/PDFSpacer';

// Data Components
export { PDFTable } from './data/PDFTable';
export { PDFList } from './data/PDFList';
export { PDFKeyValue } from './data/PDFKeyValue';
export { PDFGrid } from './data/PDFGrid';

// Visual Components
export { PDFCard } from './visual/PDFCard';
export { PDFStatCard } from './visual/PDFStatCard';
// export { PDFChart } from './visual/PDFChart'; // Disabled - has broken dependencies
export { PDFImage } from './visual/PDFImage';
export { PDFIcon } from './visual/PDFIcon';
export { PDFBadge } from './visual/PDFBadge';

// Templates
export { default as ProgramPensumPdfTemplate } from './templates/ProgramPensumPdfTemplate';
export { default as UserProfilePdfTemplate } from './templates/UserProfilePdfTemplate';
export { default as ClassroomReportPdfTemplate } from './templates/ClassroomReportPdfTemplate';

// Components
export { ProgramPensumPdfDownloadButton } from './components/ProgramPensumPdfDownloadButton';
export { UserProfilePdfDownloadButton } from './components/UserProfilePdfDownloadButton';
export { ClassroomReportPdfDownloadButton } from './components/ClassroomReportPdfDownloadButton';
export { PDFPreview } from './components/PDFPreview';

// Utilities
export * from './utils/chartToImage';
export * from './utils/pdfHelpers';
export * from './utils/pdfConfig.types';

// Styles and Theme
export * from './styles/pdfTheme';
export { pdfStyles } from './styles/pdfStyles';
export * from './styles/materialTailwindColors';

