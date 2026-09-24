/** @jest-environment jsdom */
import React, { useLayoutEffect } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { normalizeDesign, publishDesign, useDesign } from './designRuntime';
import { designDefaults } from './vinusDesign';

afterEach(() => { cleanup(); publishDesign(normalizeDesign(designDefaults)); });

it('receives a draft published between render and effect subscription', () => {
    publishDesign(normalizeDesign(designDefaults));
    function Preview() {
        const design = useDesign();
        useLayoutEffect(() => {
            publishDesign(normalizeDesign({ options: { ...designDefaults.options, chart_shape: 'bar' } }));
        }, []);
        return <output>{design.options.chart_shape}</output>;
    }
    render(<Preview />);
    expect(screen.getByText('bar')).toBeTruthy();
});
