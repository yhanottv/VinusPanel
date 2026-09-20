import React, { useEffect, useMemo, useState } from 'react';
import {
    faArrowDown,
    faArrowUp,
    faBolt,
    faDatabase,
    faLayerGroup,
    faNetworkWired,
    faStopwatch,
} from '@fortawesome/free-solid-svg-icons';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { ServerContext } from '@/state/server';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import StatBlock from '@/components/server/console/StatBlock';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import classNames from 'classnames';
import styles from '@/components/server/console/style.module.css';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

const getBackgroundColor = (value: number, max: number | null): string | undefined => {
    const delta = !max ? 0 : value / max;

    if (delta > 0.8) {
        if (delta > 0.9) {
            return 'bg-red-500';
        }
        return 'bg-yellow-500';
    }

    return undefined;
};

const Limit = ({ limit, children }: { limit: string | null; children: React.ReactNode }) => (
    <>
        {children}
        <span className={'ml-1 text-gray-300 text-[70%] select-none'}>/ {limit || <>&infin;</>}</span>
    </>
);

const percentage = (value: number, maximum: number) =>
    maximum > 0 ? Math.max(0, Math.min(100, (value / maximum) * 100)) : 0;

const ServerDetailsBlock = ({ className }: { className?: string }) => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });

    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);

    const textLimits = useMemo(
        () => ({
            cpu: limits?.cpu ? `${limits.cpu}%` : null,
            memory: limits?.memory ? bytesToString(mbToBytes(limits.memory)) : null,
            disk: limits?.disk ? bytesToString(mbToBytes(limits.disk)) : null,
        }),
        [limits]
    );

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);

        return !match ? 'n/a' : `${match.alias || ip(match.ip)}:${match.port}`;
    });
    const uptimeSeconds = stats.uptime / 1000;
    const uptimeLabel = `${Math.floor(uptimeSeconds / 3600)} h ${Math.floor((uptimeSeconds % 3600) / 60)} min`;

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }

        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let stats: any = {};
        try {
            stats = JSON.parse(data);
        } catch (e) {
            return;
        }

        setStats({
            memory: stats.memory_bytes,
            cpu: stats.cpu_absolute,
            disk: stats.disk_bytes,
            tx: stats.network.tx_bytes,
            rx: stats.network.rx_bytes,
            uptime: stats.uptime || 0,
        });
    });

    return (
        <div className={classNames(styles.details_grid, className)}>
            <StatBlock
                icon={faNetworkWired}
                title={'Adresse du serveur'}
                copyOnClick={allocation}
                className={styles.stat_block_wide}
                accent={'#ff7a1a'}
            >
                {allocation}
            </StatBlock>
            <StatBlock
                icon={faStopwatch}
                title={'Disponibilité'}
                color={getBackgroundColor(status === 'running' ? 0 : status !== 'offline' ? 9 : 10, 10)}
                progress={status === 'running' ? 100 : 0}
                accent={status === 'running' ? '#43d6a3' : '#fb7185'}
            >
                {status === null
                    ? 'Hors ligne'
                    : stats.uptime > 0
                    ? uptimeLabel
                    : status === 'starting'
                    ? 'Démarrage'
                    : status === 'stopping'
                    ? 'Arrêt'
                    : 'Connexion…'}
            </StatBlock>
            <StatBlock
                icon={faBolt}
                title={'Processeur'}
                color={getBackgroundColor(stats.cpu, limits.cpu)}
                progress={percentage(stats.cpu, limits.cpu)}
                accent={'#ff7a1a'}
            >
                {status === 'offline' ? (
                    <span className={'text-gray-400'}>Hors ligne</span>
                ) : (
                    <Limit limit={textLimits.cpu}>{stats.cpu.toFixed(2)}%</Limit>
                )}
            </StatBlock>
            <StatBlock
                icon={faLayerGroup}
                title={'Mémoire'}
                color={getBackgroundColor(stats.memory / 1024, limits.memory * 1024)}
                progress={percentage(stats.memory, mbToBytes(limits.memory))}
                accent={'#a78bfa'}
            >
                {status === 'offline' ? (
                    <span className={'text-gray-400'}>Hors ligne</span>
                ) : (
                    <Limit limit={textLimits.memory}>{bytesToString(stats.memory)}</Limit>
                )}
            </StatBlock>
            <StatBlock
                icon={faDatabase}
                title={'Disque'}
                color={getBackgroundColor(stats.disk / 1024, limits.disk * 1024)}
                progress={percentage(stats.disk, mbToBytes(limits.disk))}
                accent={'#fbbf24'}
            >
                <Limit limit={textLimits.disk}>{bytesToString(stats.disk)}</Limit>
            </StatBlock>
            <StatBlock icon={faArrowDown} title={'Trafic entrant'} accent={'#43d6a3'}>
                {status === 'offline' ? <span className={'text-gray-400'}>Hors ligne</span> : bytesToString(stats.rx)}
            </StatBlock>
            <StatBlock icon={faArrowUp} title={'Trafic sortant'} accent={'#38bdf8'}>
                {status === 'offline' ? <span className={'text-gray-400'}>Hors ligne</span> : bytesToString(stats.tx)}
            </StatBlock>
        </div>
    );
};

export default ServerDetailsBlock;
