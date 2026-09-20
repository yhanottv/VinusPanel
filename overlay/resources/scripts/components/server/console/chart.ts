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
import { useRef, useState } from 'react';
import { deepmerge, deepmergeCustom } from 'deepmerge-ts';
import { theme } from 'twin.macro';
import { hexToRgba } from '@/lib/helpers';

ChartJS.register(LineElement, PointElement, Filler, LinearScale);

const options: ChartOptions<'line'> = {
    responsive: true,
    animation: {
        duration: 450,
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
                color: 'rgba(126, 144, 163, 0.12)',
                drawBorder: false,
            },
            ticks: {
                display: true,
                count: 4,
                color: theme('colors.gray.400'),
                padding: 8,
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
                        data: Array(30).fill(-5),
                        borderColor: '#ff7a1a',
                        backgroundColor: hexToRgba('#ff7a1a', 0.12),
                    },
                    index
                )
            ),
    };
}

const merge = deepmergeCustom({ mergeArrays: false });

interface UseChartOptions {
    sets: number;
    smoothing?: number;
    options?: DeepPartial<ChartOptions<'line'>> | number | undefined;
    callback?: ChartDatasetCallback | undefined;
}

function useChart(label: string, opts?: UseChartOptions) {
    const options = getOptions(
        typeof opts?.options === 'number' ? { scales: { y: { min: 0, suggestedMax: opts.options } } } : opts?.options
    );
    const [data, setData] = useState(getEmptyData(label, opts?.sets || 1, opts?.callback));
    const smoothed = useRef<number[]>([]);
    const smoothing = Math.min(1, Math.max(0, opts?.smoothing ?? 0.35));

    const push = (items: number | null | (number | null)[]) => {
        const values = (Array.isArray(items) ? items : [items]).map((item, index) => {
            if (typeof item !== 'number') return item;

            const previous = smoothed.current[index];
            const value = previous === undefined ? item : previous + (item - previous) * smoothing;

            smoothed.current[index] = value;
            return Number(value.toFixed(2));
        });

        setData((state) =>
            merge(state, {
                datasets: values.map((item, index) => ({
                    ...state.datasets[index],
                    data: state.datasets[index].data.slice(1).concat(item),
                })),
            })
        );
    };

    const clear = () => {
        smoothed.current = [];

        setData((state) =>
            merge(state, {
                datasets: state.datasets.map((value) => ({
                    ...value,
                    data: Array(30).fill(-5),
                })),
            })
        );
    };

    return { props: { data, options }, push, clear };
}

function useChartTickLabel(label: string, max: number, tickLabel: string, roundTo?: number) {
    return useChart(label, {
        sets: 1,
        options: {
            scales: {
                y: {
                    suggestedMax: max,
                    ticks: {
                        callback(value) {
                            return `${roundTo ? Number(value).toFixed(roundTo) : value}${tickLabel}`;
                        },
                    },
                },
            },
        },
    });
}

export { useChart, useChartTickLabel, getOptions, getEmptyData };
