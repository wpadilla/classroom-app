# Chart Usage Guide for PDF Generation

## ⚠️ Important: react-pdf Limitations

**react-pdf does NOT support async operations like `useEffect`, `useState`, or any async data fetching inside PDF components.**

This means you **CANNOT** generate charts dynamically inside the PDF render cycle. Charts must be pre-generated **BEFORE** rendering the PDF.

## Solution: Pre-generate Charts

There are two approaches to use charts in PDFs:

### Approach 1: Wrapper Component (Recommended for Complex PDFs)

Use a wrapper component that generates charts before rendering the PDF.

**Example: ExcursionPdfTemplateWrapper**

```typescript
import { ExcursionPdfTemplateWrapper } from '@/components/pdf';
import { PDFDownloadLink } from '@react-pdf/renderer';

// In your React component
<PDFDownloadLink
  document={<ExcursionPdfTemplateWrapper excursion={excursion} user={user} />}
  fileName="excursion-report.pdf"
>
  Download PDF
</PDFDownloadLink>
```

**How it works:**
1. Wrapper component uses `useEffect` to generate chart images
2. Once charts are ready, it renders the actual PDF template
3. PDF template receives pre-generated chart images as props

### Approach 2: Generate Charts in Parent Component

Generate chart images in your parent React component, then pass them to the PDF.

**Example:**

```typescript
import React, { useEffect, useState } from 'react';
import { chartToImage } from '@/components/pdf';
import { PDFDownloadLink } from '@react-pdf/renderer';
import MyPdfTemplate from './MyPdfTemplate';

const MyComponent = () => {
  const [chartImage, setChartImage] = useState('');

  useEffect(() => {
    const generateChart = async () => {
      const result = await chartToImage('bar', chartData, options, {
        width: 500,
        height: 300,
      });
      setChartImage(result.base64);
    };
    generateChart();
  }, []);

  if (!chartImage) {
    return <div>Loading...</div>;
  }

  return (
    <PDFDownloadLink
      document={<MyPdfTemplate chartImage={chartImage} />}
      fileName="report.pdf"
    >
      Download PDF
    </PDFDownloadLink>
  );
};
```

## Using PDFChart Component

The `PDFChart` component now accepts a **pre-generated base64 image string**:

```typescript
import { PDFChart } from '@/components/pdf';

// Inside your PDF template
<PDFChart
  chartImage={chartImageBase64}  // Pre-generated!
  width={500}
  height={300}
  title="Sales Chart"
/>
```

## Generating Charts with chartToImage

### Basic Usage

```typescript
import { chartToImage } from '@/components/pdf';
import { ChartData } from 'chart.js';

const chartData: ChartData = {
  labels: ['Jan', 'Feb', 'Mar'],
  datasets: [{
    label: 'Sales',
    data: [100, 200, 150],
    backgroundColor: '#3b82f6',
  }],
};

const result = await chartToImage('bar', chartData, {
  plugins: {
    legend: { display: true },
  },
}, {
  width: 500,
  height: 300,
  backgroundColor: '#ffffff',
});

// result.base64 contains the chart image
```

### Helper Functions

```typescript
import {
  createBarChartImage,
  createLineChartImage,
  createPieChartImage,
} from '@/components/pdf';

// Bar chart
const barChart = await createBarChartImage(
  ['Q1', 'Q2', 'Q3', 'Q4'],
  [100, 200, 150, 300],
  'Quarterly Sales',
  '#3b82f6'
);

// Line chart
const lineChart = await createLineChartImage(
  ['Jan', 'Feb', 'Mar'],
  [10, 20, 15],
  'Monthly Growth',
  '#22c55e'
);

// Pie chart
const pieChart = await createPieChartImage(
  ['Product A', 'Product B', 'Product C'],
  [30, 50, 20],
  ['#3b82f6', '#ef4444', '#22c55e'],
  'pie'
);
```

### Batch Generation

For multiple charts:

```typescript
import { batchChartsToImages } from '@/components/pdf';

const charts = await batchChartsToImages([
  {
    type: 'bar',
    data: barData,
    options: barOptions,
    imageOptions: { width: 500, height: 300 },
  },
  {
    type: 'line',
    data: lineData,
    options: lineOptions,
    imageOptions: { width: 500, height: 300 },
  },
]);

// charts[0].base64, charts[1].base64, ...
```

## Complete Example

```typescript
// ExcursionPdfDownloader.tsx
import React, { useEffect, useState } from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { chartToImage, ExcursionPdfTemplate } from '@/components/pdf';
import { IEvent } from '@/models/excursionModel';
import IUser from '@/models/interfaces/userModel';

interface ExcursionPdfDownloaderProps {
  excursion: IEvent;
  user: IUser;
}

export const ExcursionPdfDownloader: React.FC<ExcursionPdfDownloaderProps> = ({
  excursion,
  user,
}) => {
  const [chartImage, setChartImage] = useState('');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const prepareCharts = async () => {
      // Calculate data
      const totalReceived = calculateTotalReceived(excursion);
      const totalExpenses = calculateTotalExpenses(excursion);

      // Generate chart
      const result = await chartToImage('bar', {
        labels: ['Ingresos', 'Gastos'],
        datasets: [{
          data: [totalReceived, totalExpenses],
          backgroundColor: ['#22c55e', '#ef4444'],
        }],
      });

      setChartImage(result.base64);
      setIsReady(true);
    };

    prepareCharts();
  }, [excursion]);

  if (!isReady) {
    return <button disabled>Preparing PDF...</button>;
  }

  return (
    <PDFDownloadLink
      document={
        <ExcursionPdfTemplate
          excursion={excursion}
          user={user}
          chartImage={chartImage}
        />
      }
      fileName={`${excursion.title}-report.pdf`}
    >
      Download PDF
    </PDFDownloadLink>
  );
};
```

## Common Errors and Solutions

### Error: "Failed to generate chart"

**Cause**: Trying to use `useEffect` inside PDF component

**Solution**: Use a wrapper component or generate charts in parent component

### Error: PDF shows "Loading..." forever

**Cause**: Async operation never completes inside PDF

**Solution**: Pre-generate all data before rendering PDF

### Error: Chart appears blank

**Cause**:
- Missing Chart.js registration
- Invalid chart data
- Incorrect dimensions

**Solution**:
```typescript
// Ensure chartToImage is called (it auto-registers Chart.js components)
// Check chart data format
// Verify width/height are reasonable (100-1000px)
```

## Best Practices

1. ✅ **Always pre-generate charts** before PDF render
2. ✅ **Use wrapper components** for complex PDFs with charts
3. ✅ **Show loading states** while charts are being generated
4. ✅ **Cache generated charts** if data doesn't change
5. ✅ **Handle errors** gracefully with fallbacks
6. ❌ **Never use `useEffect`** inside PDF components
7. ❌ **Never call async functions** during PDF render
8. ❌ **Never fetch data** inside PDF components

## Performance Tips

1. **Generate charts in parallel** using `batchChartsToImages`
2. **Optimize chart dimensions** (smaller = faster)
3. **Disable animations** in chart options
4. **Cache chart images** for unchanged data
5. **Use appropriate devicePixelRatio** (default: 2)

## Need Help?

See:
- `ExcursionPdfTemplateWrapper.tsx` for a complete example
- `chartToImage.ts` for chart generation utilities
- `PDFChart.tsx` for component implementation

