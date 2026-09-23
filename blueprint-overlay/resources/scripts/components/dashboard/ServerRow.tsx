import { vt } from '@/locales/translate';
import BeforeEntryName from '@blueprint/components/Dashboard/Serverlist/ServerRow/BeforeEntryName';
import AfterEntryName from '@blueprint/components/Dashboard/Serverlist/ServerRow/AfterEntryName';
import BeforeEntryDescription from '@blueprint/components/Dashboard/Serverlist/ServerRow/BeforeEntryDescription';
import AfterEntryDescription from '@blueprint/components/Dashboard/Serverlist/ServerRow/AfterEntryDescription';
import ResourceLimits from '@blueprint/components/Dashboard/Serverlist/ServerRow/ResourceLimits';
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
import { serverDesign, vinusDesign, VinusDesignSettings } from '@/vinusDesign';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const statusColor = (status: ServerPowerState | 'loading' | 'suspended' | 'maintenance' | 'unavailable') => {
    if (status === 'running') return '#34d399';
    if (status === 'offline' || status === 'suspended' || status === 'unavailable') return '#fb7185';
    if (status === 'loading') return '#94a3b8';
    return '#fbbf24';
};

const ServerCard = styled(GreyRowBox)<{
    $status: ReturnType<typeof getDisplayStatus>['key'];
    $view: 'grid' | 'list';
    $color: string;
    $banner: string;
    $defaultColor: string;
}>`
    ${tw`relative grid min-h-[14rem] gap-4 overflow-hidden rounded-xl border p-5 no-underline`};
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto 1fr;
    background: ${({ $banner, $color }) => $banner
        ? `linear-gradient(90deg, rgba(4,4,6,.91), rgba(4,4,6,.62)), url(${$banner}) center / cover, ${$color}`
        : $color};
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: inset 3px 0 0 ${({ $color, $defaultColor }) => $color === $defaultColor ? 'var(--vinus-accent)' : $color};
    transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;

    &::before {
        content: none;
        ${tw`absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full`};
        background: ${({ $status }) => statusColor($status)};
        z-index: 2;
    }

    &::after {
        content: '';
        ${tw`pointer-events-none absolute inset-0`};
        background: none;
    }

    & > * {
        z-index: 1;
    }

    &:hover {
        border-color: rgba(255, 255, 255, 0.15);
        filter: brightness(1.12);
        transform: none;
    }

    &:focus-visible {
        outline: 2px solid var(--vinus-accent);
        outline-offset: 3px;
    }

    @media (max-width: 639px) {
        ${tw`min-h-0 gap-4 p-5`};
    }

    ${({ $view }) =>
        $view === 'list' &&
        `
        min-height: 0;
        grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
        grid-template-rows: auto auto;
        align-items: center;
        & > :nth-child(2) { grid-column: 1; padding: 0; border: 0; background: none; }
        & > :nth-child(3) { grid-column: 2; grid-row: 1 / span 2; }
        gap: .75rem 2rem;
        padding: 1.25rem;

        &::after {
            background: none;
        }

        @media (max-width: 767px) {
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: auto auto auto;
            & > :nth-child(3) { grid-column: 1; grid-row: auto; }
        }
    `}

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

const ServerIdentity = styled.div`
    ${tw`flex min-w-0 items-start`};
`;

const ServerIcon = styled.div<{ $status: ReturnType<typeof getDisplayStatus>['key'] }>`
    ${tw`mr-3 flex h-10 w-10 flex-none items-center justify-center rounded-xl text-base`};
    color: ${({ $status }) => statusColor($status)};
    background: rgba(0, 0, 0, 0.28);
    border: 1px solid ${({ $status }) => statusColor($status)}38;
    box-shadow: none;
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
        box-shadow: none;
    }
`;

const ServerName = styled.p`
    ${tw`text-base font-semibold text-neutral-100`};
    letter-spacing: -0.025em;
`;

const AddressBlock = styled.div`
    ${tw`self-start rounded-lg border px-3 py-2`};
    width: fit-content;
    max-width: 100%;
    background: rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.07);
`;

const MetricGrid = styled.div<{ $view: 'grid' | 'list' }>`
    ${tw`grid grid-cols-3 gap-3 self-end border-t pt-4`};
    border-color: rgba(255, 255, 255, 0.08);

    ${({ $view }) =>
        $view === 'list' &&
        `
        align-self: center;
        border-top: 0;
        padding-top: 0;

        @media (max-width: 767px) {
            border-top: 1px solid rgba(157, 176, 195, 0.13);
            padding-top: 1rem;
        }
    `}
`;

const MetricItem = styled.div<{ $alarm: boolean }>`
    ${tw`min-w-0`};

    .metric-icon {
        color: ${({ $alarm }) => ($alarm ? '#fb7185' : '#94a3b8')};
    }
`;

const MetricTrack = styled.div<{ $alarm: boolean }>`
    ${tw`mt-2 h-1 overflow-hidden rounded-full`};
    background: rgba(255, 255, 255, 0.07);

    & > span {
        ${tw`block h-full rounded-full`};
        background: ${({ $alarm }) => ($alarm ? '#fb7185' : '#cda37e')};
        transition: width 250ms ease;
    }

    @media (prefers-reduced-motion: reduce) {
        & > span {
            transition: none;
        }
    }
`;

const CardChevron = styled(FontAwesomeIcon)`
    ${tw`absolute right-3 top-3 hidden h-3 w-3 text-neutral-500 sm:block`};
`;

export type ServerDisplayState = ServerPowerState | 'loading' | 'suspended' | 'maintenance' | 'unavailable';

type DisplayStatus = {
    key: ServerDisplayState;
    label: string;
};

function getDisplayStatus(stats: ServerStats | null, server: Server, isSuspended: boolean): DisplayStatus {
    if (isSuspended) {
        return { key: 'suspended', label: server.status === 'suspended' ? vt("Suspendu") : vt("Connexion impossible") };
    }
    if (server.isNodeUnderMaintenance) return { key: 'maintenance', label: 'Maintenance' };
    if (server.isTransferring) return { key: 'maintenance', label: vt("Transfert") };
    if (server.status === 'installing') return { key: 'maintenance', label: 'Installation' };
    if (server.status === 'restoring_backup') return { key: 'maintenance', label: vt('Restauration') };
    if (!stats) return { key: 'loading', label: vt("Connexion…") };
    if (stats.status === 'running') return { key: 'running', label: vt("En ligne") };
    if (stats.status === 'offline') return { key: 'offline', label: vt("Hors ligne") };
    return { key: stats.status || 'unavailable', label: vt("Indisponible") };
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
        <p css={tw`truncate text-xs text-neutral-500`}>{vt("sur ")}{limit}</p>
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
    view = 'grid',
    onStatusChange,
    design,
}: {
    server: Server;
    className?: string;
    view?: 'grid' | 'list';
    onStatusChange?: (uuid: string, status: ServerDisplayState) => void;
    design?: VinusDesignSettings;
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

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : vt("Illimité");
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : vt("Illimité");
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : vt("Illimité");

    const displayStatus = getDisplayStatus(stats, server, isSuspended);
    const appearance = design ? (design.servers[server.uuid] || {}) : serverDesign(server.uuid);
    const defaultColor = design?.server_card || vinusDesign.server_card;
    const allocation = server.allocations.find((item) => item.isDefault);
    const cpuUsage = stats ? percent(stats.cpuUsagePercent, server.limits.cpu) : 0;
    const memoryUsage = stats ? percent(stats.memoryUsageInBytes, mbToBytes(server.limits.memory)) : 0;
    const diskUsage = stats ? percent(stats.diskUsageInBytes, mbToBytes(server.limits.disk)) : 0;

    useEffect(() => {
        onStatusChange?.(server.uuid, displayStatus.key);
    }, [displayStatus.key, onStatusChange, server.uuid]);

    return (
        <ServerCard
            as={Link}
            to={`/server/${server.id}`}
            className={className}
            $status={displayStatus.key}
            $view={view}
            $color={appearance.color || defaultColor}
            $banner={appearance.banner || ''}
            $defaultColor={defaultColor}
        >
            <ServerIdentity>
                <ServerIcon $status={displayStatus.key}>
                    <FontAwesomeIcon icon={faServer} />
                </ServerIcon>
                <div css={tw`min-w-0`}>
                    <div css={tw`flex flex-col flex-wrap items-start gap-2 sm:flex-row sm:items-center`}>
                        <BeforeEntryName /><ServerName>{server.name}</ServerName><AfterEntryName />
                        <StatusBadge $status={displayStatus.key}>{displayStatus.label}</StatusBadge>
                    </div>
                    {!!server.description && (
                        <p css={tw`mt-1 line-clamp-1 text-xs text-neutral-400`}><BeforeEntryDescription />{server.description}<AfterEntryDescription /></p>
                    )}
                </div>
            </ServerIdentity>
            <AddressBlock>
                <p css={tw`text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-neutral-500`}>{vt("Adresse")}</p>
                <div css={tw`mt-1 flex items-center`}>
                    <FontAwesomeIcon icon={faEthernet} css={tw`mr-2 text-neutral-500`} />
                    <p css={tw`truncate text-sm font-medium text-neutral-200`}>
                        {allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : vt("Non attribuée")}
                    </p>
                </div>
            </AddressBlock>
            <ResourceLimits /><MetricGrid $view={view}>
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
                    label={vt("Mémoire")}
                    value={stats ? bytesToString(stats.memoryUsageInBytes) : '—'}
                    limit={memoryLimit}
                    usage={memoryUsage}
                    alarm={alarms.memory}
                />
                <Metric
                    icon={faHdd}
                    label={vt('Disque')}
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
