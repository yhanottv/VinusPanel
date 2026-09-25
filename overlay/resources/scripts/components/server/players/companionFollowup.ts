import http from '@/api/http';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';

export const companionEvent = 'vinus:companion-followup';
const memory = new Map<string, string>();
const keyFor = (user: string, server: string) => `vinus:players-offer:${user}:${server}`;
export function pendingCompanion(user: string, server: string): string | null {
    const key = keyFor(user, server);
    let value = memory.get(key) || null;
    try { value = localStorage.getItem(key); } catch (_) { /* Memory fallback. */ }
    const timestamp = Number(value?.split(':')[0]);
    return timestamp > 0 && Date.now() - timestamp < 7 * 86400000 ? value : null;
}
export function queueCompanion(user: string, server: string, token?: string) {
    const key = keyFor(user, server), value = token || `${Date.now()}:${Math.random().toString(36).slice(2)}`;
    memory.set(key, value);
    try { localStorage.setItem(key, value); } catch (_) { /* Memory fallback. */ }
    window.dispatchEvent(new Event(companionEvent));
}
export function dismissCompanion(user: string, server: string, expected: string) {
    if (pendingCompanion(user, server) !== expected) return;
    const key = keyFor(user, server);
    memory.delete(key);
    try { localStorage.removeItem(key); } catch (_) { /* Memory fallback. */ }
    window.dispatchEvent(new Event(companionEvent));
}

export type CompanionStage = '' | 'checking' | 'stopping' | 'installing' | 'starting' | 'done';
/** Only called by the explicit stop/install/start button. Never force-kill or retry a write. */
export async function activateCompanion(server: string, onStage: (stage: CompanionStage) => void) {
    onStage('checking');
    const endpoint = `/api/client/extensions/vinuscatalog/servers/${server}/players/companion`;
    const { data: offer } = await http.get(endpoint);
    if (!offer.supported || !offer.can_install) throw new Error('companion_unavailable');
    const current = await getServerResourceUsage(server);
    if (current.status !== 'running' && current.status !== 'offline') throw new Error('companion_power_busy');
    if (current.status === 'running') {
        onStage('stopping');
        await http.post(`/api/client/servers/${server}/power`, { signal: 'stop' });
        const deadline = Date.now() + 120000;
        let stopped = false;
        while (Date.now() < deadline) {
            await new Promise(resolve => window.setTimeout(resolve, 1500));
            if ((await getServerResourceUsage(server)).status === 'offline') { stopped = true; break; }
        }
        if (!stopped) throw new Error('companion_stop_timeout');
    }
    onStage('installing');
    const { data } = await http.post(endpoint, {}, { timeout: 120000 });
    if (data.status !== 'installed' && data.status !== 'existing') throw new Error('companion_install_failed');
    // An existing bridge may be for a different loader/version: preserve it and ask the operator to check.
    if (data.status === 'existing') return 'existing';
    onStage('starting');
    await http.post(`/api/client/servers/${server}/power`, { signal: 'start' });
    onStage('done');
    return 'installed';
}
