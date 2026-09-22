import type { ServerStatus } from '@/state/server';

export const availablePowerActions = (status: ServerStatus, connected: boolean, blocked: boolean) => {
    const ready = connected && !blocked;
    return {
        start: ready && status === 'offline',
        restart: ready && status === 'running',
        stop: ready && (status === 'running' || status === 'starting'),
        kill: ready && status === 'stopping',
    };
};
