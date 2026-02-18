// Enhanced PDF Styles - Building on PrintStyles with new component styles
// IMPORTANT: Use ONLY explicit values to prevent "@react-pdf/renderer" errors
// Do NOT use theme references - they can cause "Invalid border width: undefined" errors
import { StyleSheet } from '@react-pdf/renderer';

// ===== EXPLICIT CONSTANTS =====
// Spacing
const SPACING_XS = 4;
const SPACING_SM = 8;
const SPACING_MD = 12;
const SPACING_LG = 16;
const SPACING_XL = 20;

// Typography
const FONT_SIZE_XS = 10;
const FONT_SIZE_SM = 12;
const FONT_SIZE_BASE = 14;
const FONT_SIZE_LG = 16;
const FONT_SIZE_XL = 18;
const FONT_SIZE_2XL = 20;
const FONT_SIZE_3XL = 24;

// Colors
const COLOR_PRIMARY = '#3b82f6';
const COLOR_SUCCESS = '#22c55e';
const COLOR_WARNING = '#f59e0b';
const COLOR_ERROR = '#ef4444';
const COLOR_INFO = '#06b6d4';
const COLOR_GRAY_50 = '#f9fafb';
const COLOR_BLUE_GRAY_50 = '#f8fafc';
const COLOR_BLUE_GRAY_100 = '#f1f5f9';
const COLOR_BLUE_GRAY_200 = '#e2e8f0';
const COLOR_BLUE_GRAY_300 = '#cbd5e1';
const COLOR_BLUE_GRAY_500 = '#64748b';
const COLOR_BLUE_GRAY_600 = '#475569';
const COLOR_BLUE_GRAY_700 = '#334155';
const COLOR_BLUE_GRAY_800 = '#1e293b';
const COLOR_BLUE_GRAY_900 = '#0f172a';
const COLOR_BLUE_500 = '#3b82f6';
const COLOR_BLUE_600 = '#2563eb';

// Border
const BORDER_WIDTH_THIN = 0.5;
const BORDER_WIDTH_NORMAL = 1;
const BORDER_WIDTH_THICK = 2;
const BORDER_RADIUS_SM = 2;
const BORDER_RADIUS_MD = 5;
const BORDER_RADIUS_LG = 8;
const BORDER_RADIUS_FULL = 9999;
const BORDER_COLOR_LIGHT = '#e0e0e0';

export const pdfStyles = StyleSheet.create({
  // Page & Document
  page: {
    backgroundColor: '#fff',
    padding: SPACING_LG,
    flexDirection: 'column',
    width: '100%',
  },

  // Header & Title
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING_LG,
    width: '100%',
  },
  logo: {
    width: 90,
    height: 90,
    marginRight: SPACING_MD,
  },
  title: {
    fontSize: FONT_SIZE_3XL,
    fontWeight: 'bold',
    color: COLOR_BLUE_GRAY_900,
  },
  subtitle: {
    fontSize: FONT_SIZE_LG,
    color: COLOR_BLUE_GRAY_600,
    marginTop: SPACING_XS,
  },

  // Sections
  sectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING_LG,
    width: '100%',
    gap: SPACING_MD,
  },
  section: {
    width: '100%',
    marginBottom: SPACING_LG,
  },
  sectionComplete: {
    width: '90%',
    margin: 'auto',
    padding: SPACING_MD,
    borderWidth: BORDER_WIDTH_NORMAL,
    borderColor: BORDER_COLOR_LIGHT,
    borderRadius: BORDER_RADIUS_MD,
  },
  sectionTitle: {
    fontSize: FONT_SIZE_BASE,
    marginBottom: SPACING_MD,
    fontWeight: 'bold',
    color: COLOR_BLUE_GRAY_900,
    borderBottomWidth: BORDER_WIDTH_THICK,
    borderBottomColor: COLOR_BLUE_500,
    paddingBottom: 6,
  },

  // Rows & Key-Value Pairs
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING_XS,
  },
  label: {
    fontSize: FONT_SIZE_SM,
    fontWeight: 'bold',
    color: COLOR_BLUE_GRAY_700,
  },
  value: {
    fontSize: FONT_SIZE_SM,
    color: COLOR_BLUE_GRAY_600,
  },

  // Tables
  table: {
    width: '100%',
    borderWidth: BORDER_WIDTH_NORMAL,
    borderColor: COLOR_BLUE_GRAY_300,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: SPACING_MD,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLOR_BLUE_500,
    borderBottomWidth: BORDER_WIDTH_THICK,
    borderBottomColor: COLOR_BLUE_600,
  },
  tableHeaderCell: {
    fontSize: FONT_SIZE_XS,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: BORDER_WIDTH_THIN,
    borderBottomColor: COLOR_BLUE_GRAY_200,
    backgroundColor: '#FFFFFF',
    minHeight: 35,
  },
  tableRowStripe: {
    flexDirection: 'row',
    backgroundColor: COLOR_BLUE_GRAY_50,
    borderBottomWidth: BORDER_WIDTH_THIN,
    borderBottomColor: COLOR_BLUE_GRAY_200,
    minHeight: 35,
  },
  tableBodyCell: {
    fontSize: 9,
    color: COLOR_BLUE_GRAY_700,
    textAlign: 'left',
  },

  // Cards
  card: {
    borderWidth: BORDER_WIDTH_NORMAL,
    borderColor: BORDER_COLOR_LIGHT,
    borderRadius: BORDER_RADIUS_MD,
    padding: SPACING_MD,
    marginBottom: SPACING_MD,
    backgroundColor: '#fff',
  },
  cardHeader: {
    marginBottom: SPACING_SM,
    borderBottomWidth: BORDER_WIDTH_NORMAL,
    borderBottomColor: BORDER_COLOR_LIGHT,
    paddingBottom: SPACING_SM,
  },
  cardTitle: {
    fontSize: FONT_SIZE_LG,
    fontWeight: 'bold',
    color: COLOR_BLUE_GRAY_800,
  },
  cardSubtitle: {
    fontSize: FONT_SIZE_SM,
    color: COLOR_BLUE_GRAY_600,
    marginTop: SPACING_XS,
  },
  cardBody: {
    padding: SPACING_SM,
  },
  cardFooter: {
    borderTopWidth: BORDER_WIDTH_NORMAL,
    borderTopColor: BORDER_COLOR_LIGHT,
    paddingTop: SPACING_SM,
    marginTop: SPACING_SM,
  },

  // Statistics Cards
  statCard: {
    borderWidth: BORDER_WIDTH_NORMAL,
    borderColor: BORDER_COLOR_LIGHT,
    borderRadius: BORDER_RADIUS_MD,
    padding: SPACING_MD,
    minHeight: 80,
    backgroundColor: '#fff',
  },
  statCardIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS_MD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING_SM,
  },
  statCardValue: {
    fontSize: FONT_SIZE_2XL,
    fontWeight: 'bold',
    color: COLOR_BLUE_GRAY_900,
    marginBottom: SPACING_XS,
  },
  statCardLabel: {
    fontSize: FONT_SIZE_SM,
    color: COLOR_BLUE_GRAY_600,
  },

  // Lists
  list: {
    marginBottom: SPACING_MD,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING_XS,
  },
  listBullet: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS_FULL,
    backgroundColor: COLOR_PRIMARY,
    marginRight: SPACING_SM,
    marginTop: 4,
  },
  listNumber: {
    fontSize: FONT_SIZE_SM,
    fontWeight: 'bold',
    marginRight: SPACING_SM,
    color: COLOR_PRIMARY,
  },
  listText: {
    fontSize: FONT_SIZE_SM,
    color: COLOR_BLUE_GRAY_700,
    flex: 1,
  },

  // Badges
  badge: {
    paddingHorizontal: SPACING_SM,
    paddingVertical: SPACING_XS,
    borderRadius: BORDER_RADIUS_MD,
    fontSize: FONT_SIZE_XS,
    fontWeight: 'bold',
  },
  badgePrimary: {
    backgroundColor: COLOR_PRIMARY,
    color: '#fff',
  },
  badgeSuccess: {
    backgroundColor: COLOR_SUCCESS,
    color: '#fff',
  },
  badgeWarning: {
    backgroundColor: COLOR_WARNING,
    color: '#fff',
  },
  badgeError: {
    backgroundColor: COLOR_ERROR,
    color: '#fff',
  },
  badgeInfo: {
    backgroundColor: COLOR_INFO,
    color: '#fff',
  },

  // Columns Layout
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: SPACING_MD,
  },
  column: {
    flex: 1,
  },

  // Grid Layout
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    width: '100%',
    marginBottom: SPACING_MD,
  },
  gridItem: {
    marginRight: SPACING_MD,
    marginBottom: SPACING_MD,
  },

  // Spacer
  spacer: {
    height: SPACING_MD,
  },

  // Footer
  footer: {
    borderTopWidth: BORDER_WIDTH_NORMAL,
    borderTopColor: BORDER_COLOR_LIGHT,
    paddingTop: SPACING_MD,
    marginTop: SPACING_XL,
  },
  footerText: {
    fontSize: FONT_SIZE_XS,
    color: COLOR_BLUE_GRAY_500,
    textAlign: 'center',
  },

  // Images
  image: {
    marginBottom: SPACING_MD,
    borderRadius: BORDER_RADIUS_MD,
  },
  imageContainer: {
    marginBottom: SPACING_MD,
  },

  // Text Utilities
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  textBold: {
    fontWeight: 'bold',
  },
  textMuted: {
    color: COLOR_BLUE_GRAY_500,
  },
});

export default pdfStyles;

