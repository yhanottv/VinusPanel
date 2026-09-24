/** @jest-environment jsdom */
import React from 'react';
import { act, render, cleanup } from '@testing-library/react';
import { useChartTickLabel, formatChartValue, formatChartBytes } from './chart';

jest.mock('twin.macro', () => ({ theme: () => '#999999' }));

let chart: ReturnType<typeof useChartTickLabel>;
const Harness = ({ type = 'line' }: { type?: 'line' | 'bar' }) => { chart = useChartTickLabel('CPU', 100, '%', 0, type); return null; };
beforeEach(() => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: false });
});
afterEach(cleanup);

it('preserves the dataset and options across telemetry renders', () => {
    const { rerender } = render(React.createElement(Harness));
    const data = chart.props.data;
    const options = chart.props.options;
    const update = jest.fn();
    Object.defineProperty(chart.props.ref, 'current', { value: { data, update }, writable: true });
    for (let index = 1; index <= 40; index++) {
        act(() => chart.push(index));
        rerender(React.createElement(Harness));
        expect(chart.props.data).toBe(data);
        expect(chart.props.options).toBe(options);
    }
    expect(data.datasets[0].data).toEqual(Array.from({ length: 30 }, (_, index) => index + 11));
    expect(update).toHaveBeenCalledTimes(40);
    expect(update.mock.calls.every((args) => args.length === 0)).toBe(true);
});

it('clears only when explicitly requested and uses gaps instead of fake negative samples', () => {
    render(React.createElement(Harness));
    const data = chart.props.data;
    const update = jest.fn();
    Object.defineProperty(chart.props.ref, 'current', { value: { data, update }, writable: true });
    act(() => { chart.push(35); chart.push(70); });
    expect(data.datasets[0].data.slice(-2)).toEqual([35, 70]);
    act(() => chart.clear());
    expect(data.datasets[0].data).toEqual(Array(30).fill(null));
    expect(update).toHaveBeenLastCalledWith('none');
});

it('respects reduced-motion preference', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    render(React.createElement(Harness));
    expect(chart.props.options.animation).toBe(false);
});

it('keeps fractional axis labels compact and chooses readable memory units', () => {
    expect(formatChartValue(1666.66666666667, 'Mio')).toBe('1,6 Gio');
    expect(formatChartValue(66.66666666667, '%', 0)).toBe('67 %');
    expect(formatChartBytes(0)).toBe('0 o');
    expect(formatChartBytes(1536)).toBe('1,5 Kio');
    expect(formatChartBytes(0.5)).toBe('0,5 o');
});

it('switches between opaque bars and translucent curves without losing or inflating telemetry', () => {
    const { rerender } = render(React.createElement(Harness));
    act(() => { chart.push(0); chart.push(0.15); chart.push(0.6); });
    const samples = chart.props.data.datasets[0].data;
    const lineFill = chart.props.data.datasets[0].backgroundColor;
    rerender(React.createElement(Harness, { type: 'bar' }));
    expect(chart.props.data.datasets[0].backgroundColor).toBe('#ff9b52');
    expect(chart.props.data.datasets[0].data).toBe(samples);
    expect(samples.slice(-3)).toEqual([0, 0.15, 0.6]);
    expect(chart.props.options.scales!.y).not.toHaveProperty('suggestedMax');
    expect(chart.props.options.scales!.y!.min).toBe(0);
    expect(chart.props.options.scales!.x!.min).toBe(-0.5);
    expect(chart.props.options.scales!.x!.max).toBe(29.5);
    act(() => chart.push(0.2));
    rerender(React.createElement(Harness, { type: 'line' }));
    expect(chart.props.data.datasets[0].backgroundColor).toBe(lineFill);
    expect(chart.props.options.scales!.y).toHaveProperty('suggestedMax', 100);
    expect(chart.props.data.datasets[0].data).toBe(samples);
    expect(samples.slice(-4)).toEqual([0, 0.15, 0.6, 0.2]);
});

it('also disables bar animation when reduced motion is requested', () => {
    window.matchMedia = jest.fn().mockReturnValue({ matches: true });
    render(React.createElement(Harness, { type: 'bar' }));
    expect(chart.props.options.animation).toBe(false);
});
