/** @jest-environment jsdom */
import React from 'react';
import { act, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ServerRow from './ServerRow';
import getUsage, { ServerStats } from '@/api/server/getServerResourceUsage';
import { Server } from '@/api/server/getServer';

jest.mock('@/api/server/getServerResourceUsage');
jest.mock('@/locales/translate', () => ({ vt: (text: string) => text }));
jest.mock('@/vinusDesign', () => ({ ...jest.requireActual('@/vinusDesign'), serverDesign: () => ({}) }));

const server = { id: 'test', uuid: 'test-uuid', name: 'Test server', node: 'Node', status: null, description: '',
    isNodeUnderMaintenance: false, isTransferring: false, allocations: [], limits: { memory: 1024, disk: 2048, cpu: 100 },
} as unknown as Server;
const stats = { status: 'running', isSuspended: false, cpuUsagePercent: 10, memoryUsageInBytes: 1000,
    diskUsageInBytes: 2000, networkRxInBytes: 0, networkTxInBytes: 0, uptime: 1000,
} as ServerStats;
const usage = getUsage as jest.MockedFunction<typeof getUsage>;
const mount = (value = server) => render(<MemoryRouter><ServerRow server={value} /></MemoryRouter>);

beforeEach(() => { jest.useFakeTimers(); usage.mockReset(); });
afterEach(() => { cleanup(); jest.clearAllTimers(); jest.useRealTimers(); });

it('reports an unavailable server instead of leaving a failed request loading forever', async () => {
    usage.mockRejectedValueOnce(new Error('offline node'));
    mount();
    await act(async () => { await Promise.resolve(); });
    expect(screen.getByRole('img', { name: 'Indisponible' })).toBeInTheDocument();
    expect(screen.queryByText('Connexion…')).not.toBeInTheDocument();
});

it('recovers on the next poll without allowing overlapping requests', async () => {
    usage.mockRejectedValueOnce(new Error('offline node')).mockResolvedValue(stats);
    mount();
    await act(async () => { await Promise.resolve(); });
    await act(async () => { jest.advanceTimersByTime(30000); });
    expect(screen.getByRole('img', { name: 'En ligne' })).toBeInTheDocument();
    expect(usage).toHaveBeenCalledTimes(2);
});

it('does not start a polling timer when a pending request resolves after unmount', async () => {
    let resolve!: (value: ServerStats) => void;
    usage.mockReturnValueOnce(new Promise(value => { resolve = value; }));
    const view = mount();
    view.unmount();
    await act(async () => { resolve(stats); });
    act(() => { jest.advanceTimersByTime(90000); });
    expect(usage).toHaveBeenCalledTimes(1);
});

it('does not request resource usage while a node is under maintenance', () => {
    mount({ ...server, isNodeUnderMaintenance: true });
    expect(screen.getByRole('img', { name: 'Maintenance' })).toBeInTheDocument();
    expect(usage).not.toHaveBeenCalled();
});
