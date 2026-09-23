/** @jest-environment jsdom */
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import Bootstrap from './ServerStatusBootstrap';
import getUsage, { ServerStats } from '@/api/server/getServerResourceUsage';

const mockSetStatus = jest.fn();
const mockListeners = new Set<() => void>();
const mockSocket = { addListener: (_: string, fn: () => void) => mockListeners.add(fn), removeListener: (_: string, fn: () => void) => mockListeners.delete(fn) };
const mockState = { server: { data: { uuid: 'test' } }, socket: { connected: true, instance: mockSocket } };
jest.mock('@/state/server', () => ({ ServerContext: {
    useStoreState: (selector: (s: typeof mockState) => unknown) => selector(mockState),
    useStoreActions: (selector: (s: unknown) => unknown) => selector({ status: { setServerStatus: mockSetStatus } }),
} }));
jest.mock('@/api/server/getServerResourceUsage');
const usage = getUsage as jest.MockedFunction<typeof getUsage>;
beforeEach(() => { usage.mockReset(); mockSetStatus.mockClear(); mockListeners.clear(); });
afterEach(cleanup);
it('initializes offline power controls without mounting the console', async () => {
    usage.mockResolvedValue({ status: 'offline' } as ServerStats);
    render(<Bootstrap />);
    await act(async () => { await Promise.resolve(); });
    expect(mockSetStatus.mock.calls).toEqual([[null], ['offline']]);
});
it('does not overwrite a newer socket status with a stale HTTP response', async () => {
    let resolve!: (s: ServerStats) => void;
    usage.mockReturnValue(new Promise(value => { resolve = value; }));
    render(<Bootstrap />);
    mockListeners.forEach(fn => fn());
    await act(async () => { resolve({ status: 'offline' } as ServerStats); });
    expect(mockSetStatus.mock.calls).toEqual([[null]]);
});
it('ignores pending results and removes the listener after unmount', async () => {
    let resolve!: (s: ServerStats) => void;
    usage.mockReturnValue(new Promise(value => { resolve = value; }));
    const view = render(<Bootstrap />); view.unmount();
    await act(async () => { resolve({ status: 'running' } as ServerStats); });
    expect(mockSetStatus.mock.calls).toEqual([[null]]);
    expect(mockListeners.size).toBe(0);
});
it('keeps an unknown state after a failed resource request', async () => {
    usage.mockRejectedValue(new Error('Unavailable'));
    render(<Bootstrap />);
    await act(async () => { await Promise.resolve(); });
    expect(mockSetStatus.mock.calls).toEqual([[null]]);
});
