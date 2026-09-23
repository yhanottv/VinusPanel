import { useEffect, useRef, useState } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';

export type Telemetry = { cpu: number; memory: number; disk: number; uptime: number; inbound: number; outbound: number };
export function parseTelemetry(raw: string): (Telemetry & { rx: number; tx: number }) | null {
    try {
        const value = JSON.parse(raw);
        const next = { cpu: value.cpu_absolute, memory: value.memory_bytes, disk: value.disk_bytes, uptime: value.uptime ?? 0, rx: value.network?.rx_bytes ?? 0, tx: value.network?.tx_bytes ?? 0, inbound: 0, outbound: 0 };
        return Object.values(next).every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0) ? next : null;
    } catch { return null; }
}
export default function useServerTelemetry() {
    const uuid = ServerContext.useStoreState(s => s.server.data!.uuid);
    const { instance, connected } = ServerContext.useStoreState(s => s.socket);
    const status = ServerContext.useStoreState(s => s.status.value);
    const [stats, setStats] = useState<Telemetry | null>(null);
    const previous = useRef<{ rx: number; tx: number; at: number } | null>(null);
    const received = useRef(false);
    useEffect(() => {
        let active = true;
        received.current = false; previous.current = null; setStats(null);
        getServerResourceUsage(uuid).then(s => {
            if (active && !received.current) setStats({ cpu: s.cpuUsagePercent, memory: s.memoryUsageInBytes, disk: s.diskUsageInBytes, uptime: s.uptime, inbound: 0, outbound: 0 });
        }).catch(() => { /* A failed read stays unknown until a socket sample arrives. */ });
        if (connected && instance) instance.send(SocketRequest.SEND_STATS);
        return () => { active = false; };
    }, [uuid, connected, instance]);
    useWebsocketEvent(SocketEvent.STATS, raw => {
        const next = parseTelemetry(raw);
        if (!next) return;
        received.current = true;
        const at = performance.now();
        const seconds = previous.current ? (at - previous.current.at) / 1000 : 0;
        if (previous.current && seconds > 0) {
            next.inbound = Math.max(0, next.rx - previous.current.rx) / seconds;
            next.outbound = Math.max(0, next.tx - previous.current.tx) / seconds;
        }
        previous.current = { rx: next.rx, tx: next.tx, at };
        setStats(next);
    });
    useEffect(() => {
        if (status === 'offline') { previous.current = null; setStats(s => s && ({ ...s, cpu: 0, memory: 0, uptime: 0, inbound: 0, outbound: 0 })); }
    }, [status]);
    return { stats, connected, status };
}
