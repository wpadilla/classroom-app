# PDF Generation System Documentation

## Overview

This is a scalable, reusable PDF generation system built on top of `@react-pdf/renderer` with Material Tailwind-inspired styling. It provides a comprehensive set of components for creating professional PDFs with tables, charts, cards, and more.

## Features

- ✅ **Type-safe**: Full TypeScript support with comprehensive interfaces
- ✅ **Composable**: Build complex layouts by composing simple components
- ✅ **Themed**: Material Tailwind design tokens for consistent styling
- ✅ **Charts**: Integrated chart generation using Chart.js
- ✅ **Flexible**: Hybrid JSON/React component configuration
- ✅ **Reusable**: Data-agnostic components work with any entity

## Installation

The system uses these dependencies (already installed):

```bash
pnpm add chart.js@4.5.1 react-chartjs-2@5.3.0
pnpm add @react-pdf/renderer
```

## Quick Start

### Basic Usage

```typescript
import { PDFDocument, PDFHeader, PDFSection, PDFTable } from '@/components/pdf';

const MyPDF = ({ data }) => (
  <PDFDocument
    metadata={{
      title: 'My Report',
      author: 'TravelM',
    }}
  >
    <PDFHeader title="My Report" />

    <PDFSection title="Data">
      <PDFTable
        columns={[
          { key: 'name', label: 'Name' },
          { key: 'value', label: 'Value' },
        ]}
        data={data}
      />
    </PDFSection>
  </PDFDocument>
);
```

### Rendering PDFs

Use React PDF's `PDFDownloadLink` or `BlobProvider`:

```typescript
import { PDFDownloadLink } from '@react-pdf/renderer';

<PDFDownloadLink
  document={<MyPDF data={data} />}
  fileName="report.pdf"
>
  Download PDF
</PDFDownloadLink>
```

## Component Categories

### Core Components

#### PDFDocument
Root component that wraps your PDF content.

```typescript
<PDFDocument
  metadata={{ title, author, subject }}
  pageSize="A4"
  orientation="portrait"
  context={{ user, organization }}
>
  {children}
</PDFDocument>
```

#### PDFTemplate
Theme and context provider (used internally by PDFDocument).

#### PDFPage
Individual page component with pagination support.

### Layout Components

#### PDFHeader
```typescript
<PDFHeader
  logo={logoImage}
  title="Report Title"
  subtitle="Subtitle"
  metadata={{ Date: '2024-01-01', Author: 'John' }}
/>
```

#### PDFSection
```typescript
<PDFSection
  title="Section Title"
  border={true}
  padding={12}
>
  {content}
</PDFSection>
```

#### PDFColumns
```typescript
<PDFColumns columns={2} gap={10}>
  <PDFSection>Column 1</PDFSection>
  <PDFSection>Column 2</PDFSection>
</PDFColumns>
```

#### PDFSpacer
```typescript
<PDFSpacer height={20} />
```

### Data Components

#### PDFTable
```typescript
<PDFTable
  columns={[
    { key: 'id', label: 'ID', width: '10%' },
    { key: 'name', label: 'Name', align: 'left' },
    { key: 'amount', label: 'Amount', render: (val) => `$${val}` },
  ]}
  data={tableData}
  stripe={true}
  headerColor="#f3f4f6"
/>
```

#### PDFList
```typescript
<PDFList
  items={['Item 1', 'Item 2', 'Item 3']}
  type="bullet" // or "numbered"
/>
```

#### PDFKeyValue
```typescript
<PDFKeyValue
  data={{
    'Customer Name': 'John Doe',
    'Order Date': '2024-01-01',
    'Total': '$1,234',
  }}
/>
```

#### PDFGrid
```typescript
<PDFGrid columns={3} gap={10}>
  <PDFCard {...card1} />
  <PDFCard {...card2} />
  <PDFCard {...card3} />
</PDFGrid>
```

### Visual Components

#### PDFStatCard
```typescript
<PDFStatCard
  title="Total Sales"
  value="$12,345"
  color="green"
  footer="↑ 12% from last month"
/>
```

#### PDFCard
```typescript
<PDFCard
  title="Product Name"
  subtitle="Category"
  description="Product description here"
  image={productImage}
  actions={['View', 'Edit']}
/>
```

#### PDFChart
```typescript
<PDFChart
  type="bar"
  data={{
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Sales',
      data: [12, 19, 3],
      backgroundColor: '#3b82f6',
    }],
  }}
  width={500}
  height={300}
  title="Monthly Sales"
/>
```

**Supported chart types**: `bar`, `line`, `pie`, `doughnut`, `radar`

#### PDFImage
```typescript
<PDFImage
  src={imageUrl}
  width={200}
  height={150}
  caption="Image caption"
/>
```

#### PDFBadge
```typescript
<PDFBadge
  text="Active"
  variant="success" // or "warning", "error", "info", "primary"
/>
```

## Advanced Usage

### Custom Theme

```typescript
import { createPDFTheme } from '@/components/pdf';

const customTheme = createPDFTheme({
  colors: {
    primary: '#ff0000',
    secondary: '#00ff00',
  },
  typography: {
    fontSize: {
      base: 16,
    },
  },
});

<PDFTemplate theme={customTheme}>
  {content}
</PDFTemplate>
```

### Chart Generation

Charts are automatically converted to images using Chart.js:

```typescript
import { chartToImage, createBarChartImage } from '@/components/pdf';

// Manual chart generation
const chartImage = await chartToImage('bar', data, options, {
  width: 600,
  height: 400,
});

// Helper function
const barChart = await createBarChartImage(
  ['Q1', 'Q2', 'Q3', 'Q4'],
  [100, 200, 150, 300],
  'Quarterly Sales',
  '#3b82f6'
);
```

### Using Hooks

```typescript
import { usePDFTheme, usePDFTemplateData } from '@/components/pdf';

const MyComponent = () => {
  const theme = usePDFTheme();
  const { user, organization } = usePDFTemplateData();

  return (
    <View style={{ backgroundColor: theme.colors.primary }}>
      <Text>{organization?.name}</Text>
    </View>
  );
};
```

## Migration Guide

### Migrating Existing PDF Templates

**Before:**
```typescript
import { Document, Page, View, Text } from '@react-pdf/renderer';
import pdfStyles from './PrintStyles';

<Document>
  <Page style={pdfStyles.page}>
    <View style={pdfStyles.section}>
      <Text style={pdfStyles.title}>Title</Text>
    </View>
  </Page>
</Document>
```

**After:**
```typescript
import { PDFDocument, PDFHeader, PDFSection } from '@/components/pdf';

<PDFDocument>
  <PDFHeader title="Title" />
  <PDFSection>
    {content}
  </PDFSection>
</PDFDocument>
```

## Examples

### Payment Report
See `templates/PaymentsPdfTemplate.tsx`

### Excursion Report with Charts
See `templates/ExcursionPdfTemplate.tsx`

### Generic Template
See `templates/GenericPdfTemplate.tsx`

## Best Practices

1. **Use semantic components**: Prefer `PDFSection` over raw `View` components
2. **Leverage the theme**: Use theme colors and spacing for consistency
3. **Generate charts beforehand**: For better performance, generate charts before PDF rendering
4. **Keep data separated**: Pass data as props instead of fetching inside PDF components
5. **Test with real data**: Always test with production-like data volumes

## Styling Guidelines

The system uses Material Tailwind design tokens:

- **Colors**: 15 color scales with 9 shades each
- **Typography**: 8 font sizes (xs to 4xl)
- **Spacing**: 7 spacing units (xs to 3xl)
- **Border Radius**: 6 radius options (none to full)

Access theme values:

```typescript
const theme = usePDFTheme();
theme.colors.primary // #3b82f6
theme.spacing.md // 12
theme.typography.fontSize.lg // 16
```

## Troubleshooting

### Charts not rendering
- Ensure Chart.js components are registered (automatic via `chartToImage`)
- Check chart data format matches Chart.js specifications
- Verify dimensions are reasonable (width/height)

### Images not showing
- Confirm image URL is accessible
- Check CORS settings for external images
- Use base64 encoded images when possible

### Layout issues
- Remember: react-pdf has limited CSS support (no flexbox grid, limited positioning)
- Use provided layout components (`PDFColumns`, `PDFGrid`) for complex layouts
- Test with different page sizes

### Type errors
- Ensure all imports are from `@/components/pdf`
- Check TypeScript interfaces in `utils/pdfConfig.types.ts`
- Verify data structure matches component props

## Performance Tips

1. **Batch chart generation**: Use `batchChartsToImages` for multiple charts
2. **Optimize images**: Compress images before embedding
3. **Limit table rows**: Consider pagination for large datasets
4. **Cache generated PDFs**: Store generated PDFs when data doesn't change frequently

## API Reference

For complete type definitions, see:
- `utils/pdfConfig.types.ts` - All component prop interfaces
- `styles/pdfTheme.ts` - Theme configuration
- `utils/chartToImage.ts` - Chart generation utilities

## Support

For issues or questions:
1. Check this documentation
2. Review example templates in `templates/`
3. Consult type definitions for prop interfaces
4. Check the ADR.md for architectural decisions

## License

Part of the TravelM project.

