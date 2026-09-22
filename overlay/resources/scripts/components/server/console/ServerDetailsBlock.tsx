import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHdd, faClock } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import { bytesToString, mbToBytes } from '@/lib/formatters';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import styles from './workspace.module.css';

type Stats = Record<'disk' | 'uptime', number>;
const Resource = ({
    label,
    value,
    limit,
    used,
    maximum,
    icon,
}: {
    label: string;
    value: string;
    limit: string;
    used: number | null;
    maximum: number;
    icon: IconProp;
}) => {
    const percent = used !== null && maximum > 0 ? Math.min(100, Math.max(0, (used / maximum) * 100)) : null;
    return (
        <div className={styles.resource} data-alarm={percent !== null && percent >= 90}>
            <div className={styles.resource_label}>
                <span>
                    <FontAwesomeIcon icon={icon} />
                    {label}
                </span>
                <strong>{value}</strong>
            </div>
            <div
                className={styles.meter}
                role={percent === null ? undefined : 'progressbar'}
                aria-label={label}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent === null ? undefined : Math.round(percent)}
            >
                <span style={{ width: `${percent || 0}%` }} />
            </div>
            <p>{maximum > 0 ? `sur ${limit}` : 'Sans limite configurée'}</p>
        </div>
    );
};

export default ({ className }: { className?: string }) => {
    const [stats, setStats] = useState<Stats | null>(null);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    useEffect(() => {
        setStats(null);
        if (connected && instance) instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);
    useWebsocketEvent(SocketEvent.STATS, (data) => {
        try {
            const value = JSON.parse(data);
            const next = {


                disk: value.disk_bytes,
                uptime: value.uptime || 0,


            };
            if (Object.values(next).every((n) => typeof n === 'number' && Number.isFinite(n) && n >= 0)) setStats(next);
        } catch {
            /* Wait for the next valid sample. */
        }
    });
    const live = connected && status !== null && status !== 'offline' && stats !== null;
    const uptime =
        !connected || !status
            ? '—'
            : status === 'offline'
            ? 'À l’arrêt'
            : stats && stats.uptime > 0
            ? `${Math.floor(stats.uptime / 3600000)} h ${Math.floor(stats.uptime / 60000) % 60} min`
            : status === 'starting'
            ? 'Démarrage'
            : '—';
    return (
        <section className={className} aria-label={'Ressources du serveur'}>
            <div className={styles.telemetry_heading}>
                <h2>Stockage et session</h2>
                <span>{live ? 'En direct' : 'En attente'}</span>
            </div>
            <Resource
                icon={faHdd}
                label={'Stockage'}
                value={connected && stats ? bytesToString(stats.disk) : '—'}
                limit={bytesToString(mbToBytes(limits.disk))}
                used={connected && stats ? stats.disk : null}
                maximum={mbToBytes(limits.disk)}
            />
            <div className={styles.uptime}>
                <span>
                    <FontAwesomeIcon icon={faClock} /> Durée de session
                </span>
                <strong>{uptime}</strong>
            </div>
            </section>
    );
};
