import { formatLocale, panelLanguage } from '@/locales/preferences';
import { vt } from '@/locales/translate';
import {
  Chart as ChartJS,
  ChartData,
  ChartDataset,
  ChartOptions,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  ScriptableContext,
} from 'chart.js';
import { DeepPartial } from 'ts-essentials';
import { useMemo, useRef, useState } from 'react';
import { deepmerge } from 'deepmerge-ts';
import { theme } from 'twin.macro';
import { hexToRgba } from '@/lib/helpers';

ChartJS.register(LineElement, PointElement, Filler, LinearScale);

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 650,
    easing: 'easeOutCubic',
  },
  plugins: {
    legend: { display: false },
    title: { display: false },
    tooltip: { enabled: false },
  },
  layout: {
    padding: 0,
  },
  scales: {
    x: {
      min: 0,
      max: 29,
      type: 'linear',
      grid: {
        display: false,
        drawBorder: false,
      },
      ticks: {
        display: false,
      },
    },
    y: {
      min: 0,
      type: 'linear',
      grid: {
        display: true,
        color: 'rgba(255, 255, 255, 0.055)',
        drawBorder: false,
      },
      ticks: {
        display: true,
        maxTicksLimit: 3,
        precision: 0,
        color: '#777780',
        padding: 6,
        font: {
          family: theme('fontFamily.sans'),
          size: 10,
          weight: '400',
        },
      },
    },
  },
  elements: {
    point: {
      radius: 0,
    },
    line: {
      tension: 0.32,
      cubicInterpolationMode: 'monotone',
      borderWidth: 2,
      borderCapStyle: 'round',
      borderJoinStyle: 'round',
    },
  },
};

const numberLabel = (value: number, decimals: number) =>
  new Intl.NumberFormat(formatLocale, { maximumFractionDigits: decimals }).format(value);

export function formatChartValue(value: number, unit: string, decimals = 1): string {
  if ((unit === 'Mio' || unit === 'MiB') && value >= 1024) return `${numberLabel(value / 1024, 1)} ${panelLanguage === 'fr' ? 'Gio' : 'GiB'}`;
  return `${numberLabel(value, decimals)} ${unit}`;
}

export function formatChartBytes(value: number): string {
  const units = panelLanguage === 'fr' ? ['o', 'Kio', 'Mio', 'Gio', 'Tio'] : ['B', 'KiB', 'MiB', 'GiB', 'TiB'];
  const index = value > 0 ? Math.min(units.length - 1, Math.floor(Math.log(value) / Math.log(1024))) : 0;
  const safeIndex = Math.max(0, index);
  return formatChartValue(value / Math.pow(1024, safeIndex), units[safeIndex]);
}

function getOptions(opts?: DeepPartial<ChartOptions<'line'>> | undefined): ChartOptions<'line'> {
  return deepmerge(options, opts || {});
}

type ChartDatasetCallback = (value: ChartDataset<'line'>, index: number) => ChartDataset<'line'>;

function getEmptyData(label: string, sets = 1, callback?: ChartDatasetCallback | undefined): ChartData<'line'> {
  const next = callback || ((value) => value);

  return {
    labels: Array(30)
      .fill(0)
      .map((_, index) => index),
    datasets: Array(sets)
      .fill(0)
      .map((_, index) =>
        next(
          {
            fill: true,
            label,
            data: Array(30).fill(null),
            borderColor: '#ff9b52',
            backgroundColor: hexToRgba('#ff9b52', 0.12),
          },
          index
        )
      ),
  };
}

interface UseChartOptions {
  sets: number;
  type?: 'line' | 'bar';
  options?: DeepPartial<ChartOptions<'line'>> | number;
  callback?: ChartDatasetCallback;
}

// Solid colours throughout: the shading gives each column depth without fading
// small measurements into the panel background.
const columnFill = (colour: string) => ({ chart, parsed }: ScriptableContext<'line' | 'bar'>) => {
  const y = chart.scales.y;
  if (!chart.chartArea || !y || !parsed || !Number.isFinite(parsed.y)) return colour;
  const top = y.getPixelForValue(parsed.y);
  const bottom = y.getPixelForValue(0);
  if (top >= bottom) return colour;
  const fill = chart.ctx.createLinearGradient(0, top, 0, bottom);
  const green = colour === '#43d6a3';
  fill.addColorStop(0, green ? '#81dfbc' : '#ffb880');
  fill.addColorStop(1, green ? '#329a79' : '#ba713f');
  return fill;
};

function useChart(label: string, opts?: UseChartOptions) {
  const type = opts?.type || 'line';
  const chartRef = useRef<ChartJS<'line' | 'bar'>>(null);
  const chartOptions = useMemo(() => {
    const result: ChartOptions<'line' | 'bar'> = getOptions(
      typeof opts?.options === 'number' ? { scales: { y: { min: 0, suggestedMax: opts.options } } } : opts?.options
    );
    if (type === 'bar') {
      // Leave half a slot on either end so the first and latest bars are not clipped.
      result.scales!.x = { ...result.scales!.x, min: 14.5, max: 29.5 };
      const y = result.scales!.y;
      if (y?.type === 'linear') {
        delete y.suggestedMax;
        y.min = 0;
        y.grace = '10%';
        y.ticks = { ...y.ticks, precision: 2 };
      }
      result.animation = { duration: 320, easing: 'easeOutCubic' };
    }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      result.animation = false;
    }
    return result;
  }, [opts?.options, type]);
  // Keep the React data object stable. Update the mounted chart in place so
  // new telemetry never recreates its datasets or restarts the initial animation.
  const [data] = useState(() => getEmptyData(label, opts?.sets || 1, opts?.callback));
  const displayData = useMemo<ChartData<'line' | 'bar'>>(() => type === 'line' ? data : {
    ...data,
    // Retain the same sample arrays when switching modes; only presentation changes.
    datasets: data.datasets.map(dataset => ({
      ...dataset,
      backgroundColor: columnFill(typeof dataset.borderColor === 'string' ? dataset.borderColor : '#ff9b52'),
      hoverBackgroundColor: dataset.borderColor,
      borderWidth: 0,
      borderRadius: 6,
      borderSkipped: false,
      categoryPercentage: 0.72,
      barPercentage: 0.82,
      maxBarThickness: 22,
    })),
  }, [data, type]);
  const push = (items: number | null | (number | null)[]) => {
    const values = Array.isArray(items) ? items : [items];
    const target = chartRef.current?.data || data;
    target.datasets.forEach((dataset, index) => {
      const value = values[index];
      dataset.data.shift();
      dataset.data.push(typeof value === 'number' && Number.isFinite(value) ? value : null);
    });
    chartRef.current?.update();
  };
  const clear = () => {
    (chartRef.current?.data || data).datasets.forEach((dataset) => {
      dataset.data.splice(0, dataset.data.length, ...Array(30).fill(null));
    });
    chartRef.current?.update('none');
  };
  return { props: { ref: chartRef, data: displayData, options: chartOptions }, push, clear };
}

function useChartTickLabel(label: string, max: number, tickLabel: string, roundTo?: number, type: 'line' | 'bar' = 'line') {
  const chartOptions = useMemo(
    () => ({
      scales: {
        y: {
          suggestedMax: max,
          ticks: {
            callback(value: string | number) {
              return formatChartValue(Number(value), tickLabel, type === 'bar' ? Math.max(roundTo ?? 0, 2) : roundTo ?? 0);
            },
          },
        },
      },
    }),
    [max, tickLabel, roundTo, type]
  );
  return useChart(label, { sets: 1, options: chartOptions, type });
}

export { useChart, useChartTickLabel, getOptions, getEmptyData };
