import {
  Chart as ChartJS,
  ChartData,
  ChartDataset,
  ChartOptions,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
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
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: decimals }).format(value);

export function formatChartValue(value: number, unit: string, decimals = 1): string {
  if (unit === 'Mio' && value >= 1024) return `${numberLabel(value / 1024, 1)} Gio`;
  return `${numberLabel(value, decimals)} ${unit}`;
}

export function formatChartBytes(value: number): string {
  const units = ['o', 'Kio', 'Mio', 'Gio', 'Tio'];
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
            borderColor: '#ff7a1a',
            backgroundColor: hexToRgba('#ff7a1a', 0.12),
          },
          index
        )
      ),
  };
}

interface UseChartOptions {
  sets: number;
  options?: DeepPartial<ChartOptions<'line'>> | number;
  callback?: ChartDatasetCallback;
}

function useChart(label: string, opts?: UseChartOptions) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const chartOptions = useMemo(() => {
    const result = getOptions(
      typeof opts?.options === 'number' ? { scales: { y: { min: 0, suggestedMax: opts.options } } } : opts?.options
    );
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      result.animation = false;
    }
    return result;
  }, [opts?.options]);
  // Keep the React data object stable. Update the mounted chart in place so
  // new telemetry never recreates its datasets or restarts the initial animation.
  const [data] = useState(() => getEmptyData(label, opts?.sets || 1, opts?.callback));
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
  return { props: { ref: chartRef, data, options: chartOptions }, push, clear };
}

function useChartTickLabel(label: string, max: number, tickLabel: string, roundTo?: number) {
  const chartOptions = useMemo(
    () => ({
      scales: {
        y: {
          suggestedMax: max,
          ticks: {
            callback(value: string | number) {
              return formatChartValue(Number(value), tickLabel, roundTo ?? 0);
            },
          },
        },
      },
    }),
    [max, tickLabel, roundTo]
  );
  return useChart(label, { sets: 1, options: chartOptions });
}

export { useChart, useChartTickLabel, getOptions, getEmptyData };
