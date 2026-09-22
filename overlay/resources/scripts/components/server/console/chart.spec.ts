/** @jest-environment jsdom */
import React from 'react';
import { act, render, cleanup } from '@testing-library/react';
import { useChartTickLabel, formatChartValue, formatChartBytes } from './chart';

jest.mock('twin.macro', () => ({ theme: () => '#999999' }));

let chart: ReturnType<typeof useChartTickLabel>;
const Harness = () => { chart = useChartTickLabel('CPU', 100, '%'); return null; };
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
