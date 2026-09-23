import BeforeEntryName from '@blueprint/components/Dashboard/Serverlist/ServerRow/BeforeEntryName';
import AfterEntryName from '@blueprint/components/Dashboard/Serverlist/ServerRow/AfterEntryName';
import BeforeEntryDescription from '@blueprint/components/Dashboard/Serverlist/ServerRow/BeforeEntryDescription';
import AfterEntryDescription from '@blueprint/components/Dashboard/Serverlist/ServerRow/AfterEntryDescription';
import ResourceLimits from '@blueprint/components/Dashboard/Serverlist/ServerRow/ResourceLimits';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import copy from 'copy-to-clipboard';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { serverDesign, vinusDesign, VinusDesignSettings } from '@/vinusDesign';
import { vt } from '@/locales/translate';
import Icon from './DashboardIcon';
import styles from './dashboard.module.css';

export type ServerDisplayState = ServerPowerState | 'loading' | 'suspended' | 'maintenance' | 'unavailable';

export default function ServerRow({ server, view = 'list', className = '', onStatusChange, design }: {
    server: Server; view?: 'grid' | 'list'; className?: string;
    onStatusChange?: (uuid: string, status: ServerDisplayState) => void; design?: VinusDesignSettings;
}) {
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [failed, setFailed] = useState(false);
    const [copied, setCopied] = useState(false);
    useEffect(() => {
        let active = true;
        let timer: ReturnType<typeof setTimeout>;
        setStats(null); setFailed(false);
        if (server.status === 'suspended' || server.isNodeUnderMaintenance || server.isTransferring || server.status === 'installing' || server.status === 'restoring_backup') return;
        const refresh = async () => {
            try {
                const next = await getServerResourceUsage(server.uuid);
                if (active) { setStats(next); setFailed(false); }
            } catch {
                if (active) { setStats(null); setFailed(true); }
            } finally {
                if (active) timer = setTimeout(refresh, 30000);
            }
        };
        void refresh();
        return () => { active = false; clearTimeout(timer); };
    }, [server.uuid, server.status, server.isNodeUnderMaintenance, server.isTransferring]);
    useEffect(() => {
        if (!copied) return;
        const timer = setTimeout(() => setCopied(false), 2000);
        return () => clearTimeout(timer);
    }, [copied]);

    const status: ServerDisplayState = server.status === 'suspended' || stats?.isSuspended ? 'suspended'
        : server.isNodeUnderMaintenance || server.isTransferring || server.status === 'installing' || server.status === 'restoring_backup' ? 'maintenance'
        : failed ? 'unavailable' : stats?.status || 'loading';
    const labels: Record<ServerDisplayState, string> = {
        running: vt('En ligne'), offline: vt('Hors ligne'), starting: vt('Démarrage'), stopping: vt('Arrêt'),
        loading: vt('Connexion…'), suspended: vt('Suspendu'), maintenance: vt('Maintenance'), unavailable: vt('Indisponible'),
    };
    const statusLabel = server.isTransferring ? vt('Transfert') : server.status === 'installing' ? vt('Installation')
        : server.status === 'restoring_backup' ? vt('Restauration') : labels[status];
    const statusColor = status === 'running' ? '#43d6a3' : status === 'offline' || status === 'loading' ? '#8793a6'
        : status === 'unavailable' || status === 'suspended' ? '#fb7185' : '#fbbf24';
    useEffect(() => { onStatusChange?.(server.uuid, status); }, [server.uuid, status, onStatusChange]);

    const appearance = design ? (design.servers[server.uuid] || {}) : serverDesign(server.uuid);
    const baseColor = design?.server_card || vinusDesign.server_card;
    const customColor = appearance.color || (baseColor !== vinusDesign.server_card ? baseColor : 'var(--dash-surface, ' + baseColor + ')');
    const rowStyle = {
        '--status-color': statusColor,
        '--row-background': appearance.banner
            ? `linear-gradient(90deg, rgba(9,12,17,.88), rgba(9,12,17,.76)), url(${JSON.stringify(appearance.banner)}) center / cover, ${customColor}`
            : customColor,
    } as React.CSSProperties;
    const allocation = server.allocations.find(item => item.isDefault);
    const address = allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : vt('Non attribuée');
    const metrics = [
        { label: vt('Mémoire'), value: stats ? bytesToString(stats.memoryUsageInBytes, 1) : '—', limit: server.limits.memory ? bytesToString(mbToBytes(server.limits.memory), 1) : '∞', alarm: !!stats && server.limits.memory > 0 && stats.memoryUsageInBytes >= mbToBytes(server.limits.memory) * .9 },
        { label: vt('Disque'), value: stats ? bytesToString(stats.diskUsageInBytes, 1) : '—', limit: server.limits.disk ? bytesToString(mbToBytes(server.limits.disk), 1) : '∞', alarm: !!stats && server.limits.disk > 0 && stats.diskUsageInBytes >= mbToBytes(server.limits.disk) * .9 },
        { label: 'CPU', value: stats ? `${stats.cpuUsagePercent.toFixed(1)}%` : '—', limit: server.limits.cpu ? `${server.limits.cpu}%` : '∞', alarm: !!stats && server.limits.cpu > 0 && stats.cpuUsagePercent >= server.limits.cpu * .9 },
    ];
    return <article className={`${styles.serverRow} ${className}`} data-view={view} style={rowStyle} aria-label={server.name}>
        <div className={styles.identity}>
            <span className={styles.statusDot} role="img" aria-label={statusLabel} title={statusLabel} />
            <span className={styles.serverIcon}><Icon name="server" /></span>
            <div className={styles.identityText}>
                <span className={styles.extension}><BeforeEntryName /></span><Link className={styles.serverName} to={`/server/${server.id}`} title={server.description || server.name}>{server.name}</Link><span className={styles.extension}><AfterEntryName /></span>
                <span className={styles.extension}><BeforeEntryDescription /></span>
                <button className={styles.address} type="button" title={vt('Copier l’adresse')} aria-label={`${vt('Copier l’adresse')} ${address}`} disabled={!allocation} onClick={() => setCopied(copy(address))}>
                    <span>{copied ? vt('Adresse copiée') : address}</span>{copied && <Icon name="check" />}
                </button>
                <span className={styles.extension}><AfterEntryDescription /></span>
                {!['running','offline'].includes(status) && <span className={styles.serverState} role="status">{statusLabel}</span>}
            </div>
        </div>
        <span className={styles.node} title={server.node}>{server.node}</span>
        <dl className={styles.metrics}>{metrics.map(metric => <div key={metric.label} className={styles.metric} data-alarm={metric.alarm}>
            <dt>{metric.label}</dt><dd>{metric.value} / {metric.limit}</dd>
        </div>)}</dl>
        <Link className={`${styles.primaryButton} ${styles.manage}`} to={`/server/${server.id}`} aria-label={`${vt('Gérer')} ${server.name}`}>{vt('Gérer')}<Icon name="controls" /></Link>
        <span className={styles.extension}><ResourceLimits /></span>
    </article>;
}
