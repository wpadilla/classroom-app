// Chart to Image Converter
// Converts Chart.js charts to base64 images for embedding in PDFs

import { Chart, ChartType, ChartData, ChartOptions, ChartConfiguration } from 'chart.js';
import {
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  // Controllers
  BarController,
  LineController,
  PieController,
  DoughnutController,
  RadarController,
  PolarAreaController,
  BubbleController,
  ScatterController,
} from 'chart.js';
import { ChartImageOptions, ChartImageResult } from './pdfConfig.types';

// Register Chart.js components globally (only once)
let chartComponentsRegistered = false;

export const registerChartComponents = () => {
  if (chartComponentsRegistered) return;

  Chart.register(
    // Scales
    CategoryScale,
    LinearScale,
    RadialLinearScale,
    // Elements
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    // Controllers
    BarController,
    LineController,
    PieController,
    DoughnutController,
    RadarController,
    PolarAreaController,
    BubbleController,
    ScatterController,
    // Plugins
    Title,
    Tooltip,
    Legend,
    Filler
  );

  chartComponentsRegistered = true;
};

/**
 * Convert a Chart.js chart to a base64 image
 * @param chartType - Type of chart (bar, line, pie, doughnut, etc.)
 * @param data - Chart data
 * @param options - Chart options
 * @param imageOptions - Image generation options
 * @returns Promise with base64 image string and dimensions
 */
export async function chartToImage(
  chartType: ChartType,
  data: ChartData,
  options: ChartOptions = {},
  imageOptions: ChartImageOptions = {}
): Promise<ChartImageResult> {
  // Register Chart.js components
  registerChartComponents();

  const {
    width = 600,
    height = 400,
    backgroundColor = '#ffffff',
    devicePixelRatio = 2,
  } = imageOptions;

  return new Promise((resolve, reject) => {
    try {
      // Create off-screen canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      // Merge options with defaults
      const chartOptions: ChartOptions = {
        responsive: false,
        maintainAspectRatio: false,
        animation: {
          duration: 0, // Disable animations for faster rendering
        },
        ...options,
        devicePixelRatio,
      };

      // Create chart configuration
      const config: ChartConfiguration = {
        type: chartType,
        data,
        options: chartOptions,
      };

      // Create chart instance
      const chart = new Chart(ctx, config);

      // Wait for next frame to ensure chart is rendered
      requestAnimationFrame(() => {
        try {
          // Convert canvas to base64
          const base64 = canvas.toDataURL('image/png');

          // Destroy chart instance to free memory
          chart.destroy();

          // Remove canvas from memory
          canvas.remove();

          resolve({
            base64,
            width,
            height,
          });
        } catch (error) {
          reject(error);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Batch convert multiple charts to images
 * @param charts - Array of chart configurations
 * @returns Promise with array of base64 images
 */
export async function batchChartsToImages(
  charts: Array<{
    type: ChartType;
    data: ChartData;
    options?: ChartOptions;
    imageOptions?: ChartImageOptions;
  }>
): Promise<ChartImageResult[]> {
  registerChartComponents();

  const promises = charts.map((chart) =>
    chartToImage(chart.type, chart.data, chart.options, chart.imageOptions)
  );

  return Promise.all(promises);
}

/**
 * Create a simple bar chart image
 * @param labels - X-axis labels
 * @param values - Y-axis values
 * @param label - Dataset label
 * @param color - Bar color
 * @param options - Additional options
 */
export async function createBarChartImage(
  labels: string[],
  values: number[],
  label: string = 'Data',
  color: string = '#3b82f6',
  options: Partial<ChartImageOptions> = {}
): Promise<ChartImageResult> {
  const data: ChartData = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
      },
    ],
  };

  const chartOptions: ChartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return chartToImage('bar', data, chartOptions, options);
}

/**
 * Create a simple line chart image
 * @param labels - X-axis labels
 * @param values - Y-axis values
 * @param label - Dataset label
 * @param color - Line color
 * @param options - Additional options
 */
export async function createLineChartImage(
  labels: string[],
  values: number[],
  label: string = 'Data',
  color: string = '#3b82f6',
  options: Partial<ChartImageOptions> = {}
): Promise<ChartImageResult> {
  const data: ChartData = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        backgroundColor: `${color}33`, // 20% opacity
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions: ChartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return chartToImage('line', data, chartOptions, options);
}

/**
 * Create a simple pie/doughnut chart image
 * @param labels - Slice labels
 * @param values - Slice values
 * @param colors - Slice colors
 * @param type - 'pie' or 'doughnut'
 * @param options - Additional options
 */
export async function createPieChartImage(
  labels: string[],
  values: number[],
  colors: string[] = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6'],
  type: 'pie' | 'doughnut' = 'pie',
  options: Partial<ChartImageOptions> = {}
): Promise<ChartImageResult> {
  const data: ChartData = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions: ChartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'right',
      },
    },
  };

  return chartToImage(type, data, chartOptions, options);
}

/**
 * Create a radar chart image
 * @param labels - Axis labels
 * @param datasets - Multiple datasets for comparison
 * @param options - Additional options
 */
export async function createRadarChartImage(
  labels: string[],
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
  }>,
  options: Partial<ChartImageOptions> = {}
): Promise<ChartImageResult> {
  const data: ChartData = {
    labels,
    datasets: datasets.map((dataset) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: `${dataset.color}33`,
      borderColor: dataset.color,
      borderWidth: 2,
      pointBackgroundColor: dataset.color,
      pointBorderColor: '#fff',
      pointHoverBackgroundColor: '#fff',
      pointHoverBorderColor: dataset.color,
    })),
  };

  const chartOptions: ChartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
    },
    scales: {
      r: {
        beginAtZero: true,
      },
    },
  };

  return chartToImage('radar', data, chartOptions, options);
}

// Export Chart.js types for convenience
export type { ChartType, ChartData, ChartOptions, ChartConfiguration } from 'chart.js';

