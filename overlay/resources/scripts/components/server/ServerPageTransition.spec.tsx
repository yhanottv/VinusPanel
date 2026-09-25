/** @jest-environment jsdom */
import React, { useEffect, useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import ServerPageTransition from './ServerPageTransition';

let mockMotion = 'slide';
let reduced = false;
const cancel = jest.fn();
const animate = jest.fn(() => ({ cancel }));
jest.mock('@/designRuntime', () => ({ useDesign: () => ({ options: { page_motion: mockMotion, motion_duration: 280 } }) }));
beforeEach(() => {
    mockMotion = 'slide'; reduced = false;
    Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animate });
    Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: reduced, addEventListener: jest.fn(), removeEventListener: jest.fn() }) });
});
afterEach(() => { cleanup(); jest.clearAllMocks(); });

it('replays on path changes without remounting persistent content or replaying for hashes', () => {
    const history = createMemoryHistory({ initialEntries: ['/server/example/overview'] });
    const mount = jest.fn();
    function Child() {
        const [count, setCount] = useState(0);
        useEffect(() => { mount(); }, []);
        return <button onClick={() => setCount(count + 1)}>{count}</button>;
    }
    render(<Router history={history}><ServerPageTransition><Child/></ServerPageTransition></Router>);
    fireEvent.click(screen.getByRole('button'));
    act(() => { history.push('/server/example/files'); });
    expect(animate).toHaveBeenCalledTimes(2);
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(mount).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button').textContent).toBe('1');
    act(() => { history.push('/server/example/files#/plugins'); });
    expect(animate).toHaveBeenCalledTimes(2);
});

it.each(['none', 'reduced'])('respects disabled animation (%s)', mode => {
    if (mode === 'none') mockMotion = 'none'; else reduced = true;
    render(<Router history={createMemoryHistory()}><ServerPageTransition>Content</ServerPageTransition></Router>);
    expect(animate).not.toHaveBeenCalled();
});
