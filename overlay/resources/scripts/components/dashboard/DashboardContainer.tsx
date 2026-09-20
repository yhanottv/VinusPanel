import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faLayerGroup, faServer, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow, { ServerDisplayState } from '@/components/dashboard/ServerRow';
import Spinner from '@/components/elements/Spinner';
import PageContentBlock from '@/components/elements/PageContentBlock';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { usePersistedState } from '@/plugins/usePersistedState';
import Switch from '@/components/elements/Switch';
import tw from 'twin.macro';
import useSWR from 'swr';
import { PaginatedResult } from '@/api/http';
import Pagination from '@/components/elements/Pagination';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components/macro';

const DashboardHero = styled.header`
    ${tw`relative mb-5 overflow-hidden rounded-3xl border p-6 sm:p-8`};
    background: radial-gradient(circle at 84% 24%, rgba(var(--vinus-accent-rgb), 0.2), transparent 20rem),
        linear-gradient(120deg, rgba(20, 35, 52, 0.98), rgba(10, 18, 28, 0.98));
    border-color: rgba(157, 176, 195, 0.18);
    box-shadow: 0 24px 65px rgba(0, 0, 0, 0.22);

    &::after {
        content: '';
        ${tw`pointer-events-none absolute -bottom-20 right-3 h-72 w-72`};
        background: url('/assets/images/vinus/eagle.png') center / contain no-repeat;
        opacity: 0.08;
    }
`;

const HeroContent = styled.div`
    ${tw`relative z-10 max-w-2xl`};

    h1 {
        ${tw`text-3xl font-semibold text-neutral-50 sm:text-4xl`};
        letter-spacing: -0.04em;
    }
`;

const SummaryGrid = styled.div`
    ${tw`relative z-10 mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3`};
`;

const SummaryItem = styled.div<{ $tone?: 'success' | 'danger' }>`
    ${tw`flex items-center rounded-2xl border px-4 py-3`};
    background: rgba(5, 10, 16, 0.42);
    border-color: rgba(157, 176, 195, 0.14);
    backdrop-filter: blur(10px);

    & > svg {
        ${tw`mr-3`};
        color: ${({ $tone }) => ($tone === 'success' ? '#43d6a3' : $tone === 'danger' ? '#fb7185' : '#ff9b52')};
    }
`;

const DashboardToolbar = styled.div`
    ${tw`mb-5 flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between`};
    background: rgba(14, 24, 36, 0.76);
    border-color: rgba(157, 176, 195, 0.14);
`;

const AdminToggle = styled.div`
    ${tw`flex items-center rounded-xl border px-3 py-2`};
    background: rgba(5, 10, 16, 0.34);
    border-color: rgba(157, 176, 195, 0.12);
`;

const EmptyState = styled.div`
    ${tw`rounded-2xl border px-6 py-16 text-center`};
    background: rgba(16, 27, 39, 0.72);
    border-color: rgba(157, 176, 195, 0.16);
`;

const ServerGrid = styled.div`
    ${tw`grid grid-cols-1 gap-4 xl:grid-cols-2`};
`;

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const [serverStates, setServerStates] = useState<Record<string, ServerDisplayState>>({});
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const username = useStoreState((state) => state.user.data!.username);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    const onServerStatusChange = useCallback((serverUuid: string, status: ServerDisplayState) => {
        setServerStates((current) => (current[serverUuid] === status ? current : { ...current, [serverUuid]: status }));
    }, []);

    const statusSummary = useMemo(() => {
        const visibleIds = new Set(servers?.items.map((server) => server.uuid) || []);
        const values = Object.entries(serverStates)
            .filter(([serverUuid]) => visibleIds.has(serverUuid))
            .map(([, status]) => status);

        return {
            online: values.filter((status) => status === 'running').length,
            offline: values.filter((status) => ['offline', 'suspended', 'unavailable'].includes(status)).length,
            loaded: values.length,
        };
    }, [servers?.items, serverStates]);

    useEffect(() => {
        setPage(1);
        setServerStates({});
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={'VinusPanel — Serveurs'} showFlashKey={'dashboard'}>
            <DashboardHero>
                <HeroContent>
                    <p css={tw`mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300`}>
                        Centre de contrôle
                    </p>
                    <h1>Bonjour, {username}.</h1>
                    <p css={tw`mt-3 max-w-xl text-sm leading-relaxed text-neutral-300`}>
                        Retrouvez l&apos;état de votre infrastructure, les ressources utilisées et vos accès principaux
                        dans une vue unique.
                    </p>
                </HeroContent>
                <SummaryGrid>
                    <SummaryItem>
                        <FontAwesomeIcon icon={faLayerGroup} />
                        <div>
                            <p css={tw`text-xl font-semibold text-neutral-50`}>
                                {servers ? servers.pagination.total : '—'}
                            </p>
                            <p css={tw`text-xs text-neutral-400`}>Instances au total</p>
                        </div>
                    </SummaryItem>
                    <SummaryItem $tone={'success'}>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <div>
                            <p css={tw`text-xl font-semibold text-neutral-50`}>
                                {statusSummary.loaded ? statusSummary.online : '—'}
                            </p>
                            <p css={tw`text-xs text-neutral-400`}>En ligne sur cette page</p>
                        </div>
                    </SummaryItem>
                    <SummaryItem $tone={'danger'}>
                        <FontAwesomeIcon icon={faTimesCircle} />
                        <div>
                            <p css={tw`text-xl font-semibold text-neutral-50`}>
                                {statusSummary.loaded ? statusSummary.offline : '—'}
                            </p>
                            <p css={tw`text-xs text-neutral-400`}>Hors ligne ou indisponibles</p>
                        </div>
                    </SummaryItem>
                </SummaryGrid>
            </DashboardHero>
            <DashboardToolbar>
                <div css={tw`flex items-center`}>
                    <span
                        css={tw`mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 bg-opacity-10`}
                    >
                        <FontAwesomeIcon icon={faServer} css={tw`text-primary-300`} />
                    </span>
                    <div>
                        <p css={tw`text-sm font-semibold text-neutral-100`}>Vos serveurs</p>
                        <p css={tw`text-xs text-neutral-500`}>
                            {servers
                                ? `${servers.items.length} affiché${servers.items.length > 1 ? 's' : ''}`
                                : 'Chargement…'}
                        </p>
                    </div>
                </div>
                {rootAdmin && (
                    <AdminToggle>
                        <p css={tw`mr-3 text-xs font-medium text-neutral-300`}>
                            {showOnlyAdmin ? 'Vue administrateur' : 'Mes serveurs'}
                        </p>
                        <Switch
                            name={'show_all_servers'}
                            defaultChecked={showOnlyAdmin}
                            onChange={() => setShowOnlyAdmin((current) => !current)}
                        />
                    </AdminToggle>
                )}
            </DashboardToolbar>
            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            <ServerGrid>
                                {items.map((server) => (
                                    <ServerRow
                                        key={server.uuid}
                                        server={server}
                                        onStatusChange={onServerStatusChange}
                                    />
                                ))}
                            </ServerGrid>
                        ) : (
                            <EmptyState>
                                <FontAwesomeIcon icon={faServer} css={tw`mb-4 text-3xl text-neutral-600`} />
                                <p css={tw`text-lg font-medium text-neutral-200`}>Aucun serveur à afficher</p>
                                <p css={tw`mt-2 text-sm text-neutral-400`}>
                                    {showOnlyAdmin
                                        ? "Aucun autre serveur n'est disponible dans la vue administrateur."
                                        : "Aucun serveur n'est encore associé à votre compte."}
                                </p>
                            </EmptyState>
                        )
                    }
                </Pagination>
            )}
        </PageContentBlock>
    );
};
