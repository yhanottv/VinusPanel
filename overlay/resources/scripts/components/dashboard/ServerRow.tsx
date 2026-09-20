import React, { memo, useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
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
    ${tw`relative grid min-h-[17rem] gap-5 overflow-hidden rounded-2xl border p-5 no-underline sm:p-6`};
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto 1fr;
    background: linear-gradient(155deg, rgba(18, 31, 46, 0.98), rgba(11, 20, 30, 0.98));
    border-color: rgba(157, 176, 195, 0.16);
    box-shadow: 0 16px 38px rgba(0, 0, 0, 0.18);
    transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;

    &::before {
        content: '';
        ${tw`absolute bottom-4 left-0 top-4 w-1 rounded-r-full`};
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
            linear-gradient(90deg, rgba(16, 27, 39, 0.94) 0%, rgba(16, 27, 39, 0.74) 58%, rgba(16, 27, 39, 0.88) 100%),
            url('/assets/images/vinus/eagle.png') right -1.5rem top 0.5rem / 11rem auto no-repeat;
        opacity: 0.18;
    }

    & > * {
        z-index: 1;
    }

    &:hover {
        border-color: rgba(var(--vinus-accent-rgb), 0.35);
        box-shadow: 0 22px 50px rgba(0, 0, 0, 0.24), 0 0 30px rgba(var(--vinus-accent-rgb), 0.06);
        transform: translateY(-2px);
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
    ${tw`mr-4 flex h-14 w-14 flex-none items-center justify-center rounded-2xl text-lg`};
    color: ${({ $status }) => statusColor($status)};
    background: rgba(5, 9, 15, 0.58);
    border: 1px solid ${({ $status }) => statusColor($status)}38;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
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
        box-shadow: 0 0 10px ${({ $status }) => statusColor($status)}88;
    }
`;

const ServerName = styled.p`
    ${tw`text-xl font-semibold text-neutral-100`};
    letter-spacing: -0.025em;
`;

const AddressBlock = styled.div`
    ${tw`self-start rounded-xl border px-3 py-2.5`};
    width: fit-content;
    max-width: 100%;
    background: rgba(5, 10, 16, 0.32);
    border-color: rgba(157, 176, 195, 0.11);
`;

const MetricGrid = styled.div`
    ${tw`grid grid-cols-3 gap-3 self-end border-t pt-4`};
    border-color: rgba(157, 176, 195, 0.13);
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
        background: ${({ $alarm }) => ($alarm ? '#fb7185' : 'linear-gradient(90deg, #d84b00, #ff9b52)')};
        transition: width 250ms ease;
    }

    @media (prefers-reduced-motion: reduce) {
        & > span {
            transition: none;
        }
    }
`;

const CardChevron = styled(FontAwesomeIcon)`
    ${tw`absolute right-5 top-5 hidden h-3 w-3 rounded-full border p-2 text-neutral-400 sm:block`};
    background: rgba(5, 10, 16, 0.42);
    border-color: rgba(157, 176, 195, 0.14);
`;

export type ServerDisplayState = ServerPowerState | 'loading' | 'suspended' | 'maintenance' | 'unavailable';

type DisplayStatus = {
    key: ServerDisplayState;
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

export default ({
    server,
    className,
    onStatusChange,
}: {
    server: Server;
    className?: string;
    onStatusChange?: (uuid: string, status: ServerDisplayState) => void;
}) => {
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

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Illimité';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Illimité';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Illimité';

    const displayStatus = getDisplayStatus(stats, server, isSuspended);
    const allocation = server.allocations.find((item) => item.isDefault);
    const cpuUsage = stats ? percent(stats.cpuUsagePercent, server.limits.cpu) : 0;
    const memoryUsage = stats ? percent(stats.memoryUsageInBytes, mbToBytes(server.limits.memory)) : 0;
    const diskUsage = stats ? percent(stats.diskUsageInBytes, mbToBytes(server.limits.disk)) : 0;

    useEffect(() => {
        onStatusChange?.(server.uuid, displayStatus.key);
    }, [displayStatus.key, onStatusChange, server.uuid]);

    return (
        <ServerCard as={Link} to={`/server/${server.id}`} className={className} $status={displayStatus.key}>
            <ServerIdentity>
                <ServerIcon $status={displayStatus.key}>
                    <FontAwesomeIcon icon={faServer} />
                </ServerIcon>
                <div css={tw`min-w-0`}>
                    <div css={tw`flex flex-col flex-wrap items-start gap-2 pr-8 sm:flex-row sm:items-center`}>
                        <ServerName>{server.name}</ServerName>
                        <StatusBadge $status={displayStatus.key}>{displayStatus.label}</StatusBadge>
                    </div>
                    {!!server.description && (
                        <p css={tw`mt-1 line-clamp-2 text-sm text-neutral-300`}>{server.description}</p>
                    )}
                </div>
            </ServerIdentity>
            <AddressBlock>
                <p css={tw`text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-neutral-500`}>
                    Point d&apos;accès
                </p>
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
