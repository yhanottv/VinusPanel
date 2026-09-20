import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faChevronRight,
    faCube,
    faEthernet,
    faHdd,
    faMemory,
    faMicrochip,
    faServer,
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import styled from 'styled-components/macro';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const statusColor = (status: ServerPowerState | 'loading' | 'suspended' | 'maintenance' | 'unavailable') => {
    if (status === 'running') return '#34d399';
    if (status === 'offline' || status === 'suspended' || status === 'unavailable') return '#fb7185';
    if (status === 'loading') return '#94a3b8';
    return '#fbbf24';
};

const ServerCard = styled(GreyRowBox)<{ $status: ReturnType<typeof getDisplayStatus>['key'] }>`
    ${tw`relative grid min-h-[19rem] gap-5 overflow-hidden rounded-2xl border border-neutral-600 p-6 no-underline`};
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto 1fr;
    background: #101b27;
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.14);
    transition: border-color 150ms ease;

    &::before {
        content: '';
        ${tw`absolute bottom-0 left-0 top-0 w-1`};
        background: ${({ $status }) => statusColor($status)};
        z-index: 2;
    }

    &::after {
        content: '';
        ${tw`pointer-events-none absolute inset-0`};
        background: linear-gradient(
                180deg,
                #101b27 0%,
                rgba(16, 27, 39, 0.2) 24%,
                rgba(16, 27, 39, 0.2) 72%,
                #101b27 100%
            ),
            linear-gradient(90deg, rgba(16, 27, 39, 0.94) 0%, rgba(16, 27, 39, 0.68) 55%, rgba(16, 27, 39, 0.78) 100%),
            url('/assets/images/vinus/eagle.png') right 1.5rem center / 12rem auto no-repeat;
        opacity: 0.2;
    }

    & > * {
        z-index: 1;
    }

    &:hover {
        border-color: rgba(167, 184, 201, 0.38);
    }

    &:focus-visible {
        outline: 2px solid #ff7a1a;
        outline-offset: 3px;
    }

    @media (max-width: 639px) {
        ${tw`min-h-0 gap-4 p-5`};

        &::after {
            background-position: 62% center;
            opacity: 0.22;
        }
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

const ServerIdentity = styled.div`
    ${tw`flex min-w-0 items-start`};
`;

const ServerIcon = styled.div<{ $status: ReturnType<typeof getDisplayStatus>['key'] }>`
    ${tw`mr-4 flex h-12 w-12 flex-none items-center justify-center rounded-lg text-lg`};
    color: ${({ $status }) => statusColor($status)};
    background: rgba(5, 9, 15, 0.52);
    border: 1px solid rgba(148, 163, 184, 0.2);
`;

const StatusBadge = styled.span<{ $status: ReturnType<typeof getDisplayStatus>['key'] }>`
    ${tw`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium`};
    color: ${({ $status }) => statusColor($status)};
    background: ${({ $status }) => statusColor($status)}16;
    border: 1px solid ${({ $status }) => statusColor($status)}55;

    &::before {
        content: '';
        ${tw`mr-1.5 h-1.5 w-1.5 rounded-full`};
        background: ${({ $status }) => statusColor($status)};
    }
`;

const GameBadge = styled.span`
    ${tw`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium text-neutral-300`};
    background: rgba(5, 9, 15, 0.48);
    border: 1px solid rgba(214, 225, 236, 0.15);
`;

const ServerName = styled.p`
    ${tw`text-lg font-medium text-neutral-100`};
`;

const AddressBlock = styled.div`
    ${tw`self-start`};
`;

const MetricGrid = styled.div`
    ${tw`grid grid-cols-3 gap-3 self-end border-t border-neutral-600 pt-4`};
`;

const MetricItem = styled.div<{ $alarm: boolean }>`
    ${tw`min-w-0`};

    .metric-icon {
        color: ${({ $alarm }) => ($alarm ? '#fb7185' : '#94a3b8')};
    }
`;

const MetricTrack = styled.div<{ $alarm: boolean }>`
    ${tw`mt-2 h-1 overflow-hidden rounded-full`};
    background: rgba(15, 23, 32, 0.5);

    & > span {
        ${tw`block h-full rounded-full`};
        background: ${({ $alarm }) => ($alarm ? '#fb7185' : '#7e90a3')};
        transition: width 250ms ease;
    }

    @media (prefers-reduced-motion: reduce) {
        & > span {
            transition: none;
        }
    }
`;

const CardChevron = styled(FontAwesomeIcon)`
    ${tw`absolute right-5 top-5 hidden text-neutral-500 sm:block`};
`;

type DisplayStatus = {
    key: ServerPowerState | 'loading' | 'suspended' | 'maintenance' | 'unavailable';
    label: string;
};

function getDisplayStatus(stats: ServerStats | null, server: Server, isSuspended: boolean): DisplayStatus {
    if (isSuspended) {
        return { key: 'suspended', label: server.status === 'suspended' ? 'Suspendu' : 'Connexion impossible' };
    }
    if (server.isNodeUnderMaintenance) return { key: 'maintenance', label: 'Maintenance' };
    if (server.isTransferring) return { key: 'maintenance', label: 'Transfert' };
    if (server.status === 'installing') return { key: 'maintenance', label: 'Installation' };
    if (server.status === 'restoring_backup') return { key: 'maintenance', label: 'Restauration' };
    if (!stats) return { key: 'loading', label: 'Connexion…' };
    if (stats.status === 'running') return { key: 'running', label: 'En ligne' };
    if (stats.status === 'offline') return { key: 'offline', label: 'Hors ligne' };
    return { key: stats.status || 'unavailable', label: 'Indisponible' };
}

const percent = (value: number, limit: number) => (limit > 0 ? Math.max(0, Math.min(100, (value / limit) * 100)) : 0);

interface MetricProps {
    icon: typeof faMicrochip;
    label: string;
    value: string;
    limit: string;
    usage: number;
    alarm: boolean;
}

const Metric = memo(({ icon, label, value, limit, usage, alarm }: MetricProps) => (
    <MetricItem $alarm={alarm}>
        <div css={tw`flex items-center text-xs text-neutral-400`}>
            <FontAwesomeIcon className={'metric-icon'} icon={icon} css={tw`mr-1.5`} />
            <span>{label}</span>
        </div>
        <p css={tw`mt-1 truncate text-sm font-semibold text-neutral-100`}>{value}</p>
        <p css={tw`truncate text-xs text-neutral-500`}>sur {limit}</p>
        <MetricTrack
            $alarm={alarm}
            role={'progressbar'}
            aria-label={`${label}: ${value} sur ${limit}`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(usage)}
        >
            <span style={{ width: `${usage}%` }} />
        </MetricTrack>
    </MetricItem>
));

type Timer = ReturnType<typeof setInterval>;

export default ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);

    const getStats = () =>
        getServerResourceUsage(server.uuid)
            .then((data) => setStats(data))
            .catch((error) => console.error(error));

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended || server.isNodeUnderMaintenance) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 30000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended, server.isNodeUnderMaintenance]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';

    const displayStatus = getDisplayStatus(stats, server, isSuspended);
    const allocation = server.allocations.find((item) => item.isDefault);
    const cpuUsage = stats ? percent(stats.cpuUsagePercent, server.limits.cpu) : 0;
    const memoryUsage = stats ? percent(stats.memoryUsageInBytes, mbToBytes(server.limits.memory)) : 0;
    const diskUsage = stats ? percent(stats.diskUsageInBytes, mbToBytes(server.limits.disk)) : 0;

    return (
        <ServerCard as={Link} to={`/server/${server.id}`} className={className} $status={displayStatus.key}>
            <ServerIdentity>
                <ServerIcon $status={displayStatus.key}>
                    <FontAwesomeIcon icon={faServer} />
                </ServerIcon>
                <div css={tw`min-w-0`}>
                    <div css={tw`flex flex-col flex-wrap items-start gap-2 sm:flex-row sm:items-center`}>
                        <ServerName>{server.name}</ServerName>
                        <StatusBadge $status={displayStatus.key}>{displayStatus.label}</StatusBadge>
                        <GameBadge>
                            <FontAwesomeIcon icon={faCube} css={tw`mr-1.5 text-primary-300`} />
                            Instance
                        </GameBadge>
                    </div>
                    {!!server.description && (
                        <p css={tw`mt-1 line-clamp-2 text-sm text-neutral-300`}>{server.description}</p>
                    )}
                </div>
            </ServerIdentity>
            <AddressBlock>
                <p css={tw`text-xs text-neutral-500`}>Adresse</p>
                <div css={tw`mt-1 flex items-center`}>
                    <FontAwesomeIcon icon={faEthernet} css={tw`mr-2 text-neutral-500`} />
                    <p css={tw`truncate text-sm font-medium text-neutral-200`}>
                        {allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : 'Non attribuée'}
                    </p>
                </div>
            </AddressBlock>
            <MetricGrid>
                <Metric
                    icon={faMicrochip}
                    label={'CPU'}
                    value={stats ? `${stats.cpuUsagePercent.toFixed(1)} %` : '—'}
                    limit={cpuLimit}
                    usage={cpuUsage}
                    alarm={alarms.cpu}
                />
                <Metric
                    icon={faMemory}
                    label={'Mémoire'}
                    value={stats ? bytesToString(stats.memoryUsageInBytes) : '—'}
                    limit={memoryLimit}
                    usage={memoryUsage}
                    alarm={alarms.memory}
                />
                <Metric
                    icon={faHdd}
                    label={'Disque'}
                    value={stats ? bytesToString(stats.diskUsageInBytes) : '—'}
                    limit={diskLimit}
                    usage={diskUsage}
                    alarm={alarms.disk}
                />
            </MetricGrid>
            <CardChevron icon={faChevronRight} />
        </ServerCard>
    );
};
