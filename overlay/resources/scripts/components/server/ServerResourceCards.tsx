import React from 'react';
import { ServerContext } from '@/state/server';
import { bytesToString, mbToBytes } from '@/lib/formatters';
import { vt } from '@/locales/translate';
import { Telemetry } from './useServerTelemetry';
import styles from './server.module.css';

export default function ServerResourceCards({ stats, vertical = false }: { stats: Telemetry | null; vertical?: boolean }) {
    const bytes = (value: number) => bytesToString(value).replace('Bytes', 'B');
    const limits = ServerContext.useStoreState(s => s.server.data!.limits);
    const data = [
        { name: 'CPU', value: stats ? `${stats.cpu.toFixed(1)}%` : '—', limit: limits.cpu ? `${limits.cpu / 100} ${vt('cœur(s)')}` : '∞', ratio: limits.cpu && stats ? stats.cpu / limits.cpu : 0 },
        { name: vt('Mémoire'), value: stats ? bytes(stats.memory) : '—', limit: limits.memory ? bytes(mbToBytes(limits.memory)) : '∞', ratio: limits.memory && stats ? stats.memory / mbToBytes(limits.memory) : 0 },
        { name: vt('Disque'), value: stats ? bytes(stats.disk) : '—', limit: limits.disk ? bytes(mbToBytes(limits.disk)) : '∞', ratio: limits.disk && stats ? stats.disk / mbToBytes(limits.disk) : 0 },
    ];
    return <div className={styles.resources} data-vertical={vertical}>
        {data.map(item => <section className={styles.resource} key={item.name} data-alarm={item.ratio >= .9}>
            <h2>{item.name}</h2><strong>{item.value}</strong><p>{vt('sur {{value}}', { value: item.limit })}</p>
            <div className={styles.meter} aria-hidden="true"><span style={{ width: `${Math.min(100, item.ratio * 100)}%` }} /></div>
        </section>)}
        <section className={styles.resource}><h2>{vt('Réseau')}</h2><div className={styles.network}>
            <div><strong>{stats ? bytes(stats.inbound) : '—'}/s</strong><p>{vt('Entrant')}</p></div>
            <div><strong>{stats ? bytes(stats.outbound) : '—'}/s</strong><p>{vt('Sortant')}</p></div>
        </div></section>
    </div>;
}
