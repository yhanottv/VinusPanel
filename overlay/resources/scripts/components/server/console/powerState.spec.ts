import { availablePowerActions } from './powerState';

describe('console power controls', () => {
    it.each(['offline', 'running', 'starting', 'stopping', null] as const)(
        'disables commands while disconnected (%s)',
        (status) => {
            expect(Object.values(availablePowerActions(status, false, false)).some(Boolean)).toBe(false);
        }
    );
    it.each(['offline', 'running', 'starting', 'stopping', null] as const)(
        'disables commands during maintenance or transfer (%s)',
        (status) => {
            expect(Object.values(availablePowerActions(status, true, true)).some(Boolean)).toBe(false);
        }
    );
    it('only starts a stopped server', () => {
        expect(availablePowerActions('offline', true, false)).toEqual({
            start: true,
            restart: false,
            stop: false,
            kill: false,
        });
    });
    it('offers restart and graceful stop on a running server', () => {
        expect(availablePowerActions('running', true, false)).toEqual({
            start: false,
            restart: true,
            stop: true,
            kill: false,
        });
    });
    it('allows cancellation of startup without a second restart', () => {
        expect(availablePowerActions('starting', true, false)).toEqual({
            start: false,
            restart: false,
            stop: true,
            kill: false,
        });
    });
    it('only exposes force stop while the server is stopping', () => {
        expect(availablePowerActions('stopping', true, false)).toEqual({
            start: false,
            restart: false,
            stop: false,
            kill: true,
        });
    });
    it('sends nothing before status is known', () => {
        expect(Object.values(availablePowerActions(null, true, false)).some(Boolean)).toBe(false);
    });
});
