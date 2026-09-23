import { vt } from '@/locales/translate';
import BeforeContent from '@blueprint/components/Dashboard/Serverlist/BeforeContent';
import AfterContent from '@blueprint/components/Dashboard/Serverlist/AfterContent';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCheckCircle,
    faLayerGroup,
    faList,
    faServer,
    faThLarge,
    faTimesCircle,
} from '@fortawesome/free-solid-svg-icons';
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
import useProfileAppearance from '@/components/dashboard/profile/useProfileAppearance';
import { VinusDesignSettings } from '@/vinusDesign';

const DashboardHero = styled.header`
    ${tw`relative mb-7 pt-1`};
    border-color: rgba(255, 255, 255, 0.08);
`;

const HeroContent = styled.div`
    ${tw`relative z-10 max-w-2xl`};

    h1 {
        ${tw`text-3xl font-semibold text-neutral-50 sm:text-4xl`};
        letter-spacing: -0.05em;
    }
`;

const SummaryGrid = styled.div`
    ${tw`relative z-10 mt-7 grid grid-cols-3 gap-2 sm:gap-3`};
`;

const SummaryItem = styled.div<{ $tone?: 'success' | 'danger' }>`
    ${tw`flex min-w-0 flex-col items-start rounded-xl border px-3 py-3 sm:flex-row sm:items-center sm:px-5 sm:py-4`};
    background: var(--vinus-glass);
    box-shadow: var(--vinus-glass-shadow);
    border-color: rgba(255, 255, 255, 0.07);

    & > svg {
        ${tw`mb-2 sm:mb-0 sm:mr-3`};
        color: ${({ $tone }) => ($tone === 'success' ? '#43d6a3' : $tone === 'danger' ? '#fb7185' : '#ff9b52')};
    }
`;

const DashboardToolbar = styled.div`
    ${tw`mb-3 flex flex-col gap-3 border-b px-0 pb-4 pt-1 sm:flex-row sm:items-center sm:justify-between`};
    background: transparent;
    border-color: rgba(255, 255, 255, 0.07);
`;

const AdminToggle = styled.div`
    ${tw`flex items-center rounded-xl border px-3 py-2`};
    background: rgba(5, 10, 16, 0.34);
    border-color: rgba(157, 176, 195, 0.12);
`;

const ToolbarActions = styled.div`
    ${tw`flex flex-wrap items-center gap-2`};
`;

const ViewSwitcher = styled.div`
    ${tw`flex items-center rounded-xl border p-1`};
    background: rgba(0, 0, 0, 0.24);
    border-color: rgba(255, 255, 255, 0.08);

    button {
        ${tw`flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 transition-colors`};

        &:hover {
            ${tw`text-neutral-200`};
            background: rgba(255, 255, 255, 0.05);
        }

        &.active {
            color: #ff9b52;
            background: rgba(var(--vinus-accent-rgb), 0.14);
        }

        &:focus-visible {
            outline: 2px solid var(--vinus-accent);
        }
    }
`;

const EmptyState = styled.div`
    ${tw`rounded-2xl border px-6 py-16 text-center`};
    background: var(--vinus-glass);
    border-color: rgba(157, 176, 195, 0.16);
`;

const ServerGrid = styled.div<{ $view: 'grid' | 'list' }>`
    ${tw`grid grid-cols-1 gap-3`};
    ${({ $view }) => $view === 'grid' && tw`xl:grid-cols-2`};
`;

export default ({ preview = false, design }: { preview?: boolean; design?: VinusDesignSettings }) => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const [serverStates, setServerStates] = useState<Record<string, ServerDisplayState>>({});
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const username = useStoreState((state) => state.user.data!.username);
    const { appearance } = useProfileAppearance(uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);
    const [displayMode, setDisplayMode] = usePersistedState<'grid' | 'list'>(`${uuid}:vinus_display_v3`, 'list');
    const currentDisplayMode = displayMode || 'list';

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
        if (preview) return;
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page, preview]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={vt(preview ? "VinusPanel — Design" : "VinusPanel — Serveurs")} showFlashKey={'dashboard'}>
<BeforeContent />
            <DashboardHero>
                <HeroContent>
                    <p css={tw`mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400`}>{vt("Vue d’ensemble")}</p>
                    <h1>{vt("Vos serveurs")}</h1>
                    <p css={tw`mt-3 max-w-xl text-sm leading-relaxed text-neutral-300`}>{vt("Bonjour ")}{appearance.displayName || username}{vt(". Retrouvez vos serveurs et leur activité en un coup d’œil.")}</p>
                </HeroContent>
                <SummaryGrid>
                    <SummaryItem>
                        <FontAwesomeIcon icon={faLayerGroup} />
                        <div>
                            <p css={tw`text-3xl font-semibold text-neutral-50`}>
                                {servers ? servers.pagination.total : '—'}
                            </p>
                            <p css={tw`text-xs text-neutral-400`}>{vt("Serveurs au total")}</p>
                        </div>
                    </SummaryItem>
                    <SummaryItem $tone={'success'}>
                        <FontAwesomeIcon icon={faCheckCircle} />
                        <div>
                            <p css={tw`text-3xl font-semibold text-neutral-50`}>
                                {statusSummary.loaded ? statusSummary.online : '—'}
                            </p>
                            <p css={tw`text-xs text-neutral-400`}>{vt("En ligne · cette page")}</p>
                        </div>
                    </SummaryItem>
                    <SummaryItem $tone={'danger'}>
                        <FontAwesomeIcon icon={faTimesCircle} />
                        <div>
                            <p css={tw`text-3xl font-semibold text-neutral-50`}>
                                {statusSummary.loaded ? statusSummary.offline : '—'}
                            </p>
                            <p css={tw`text-xs text-neutral-400`}>{vt("Hors ligne · cette page")}</p>
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
                        <p css={tw`text-sm font-semibold text-neutral-100`}>{vt("Vos serveurs")}</p>
                        <p css={tw`text-xs text-neutral-500`}>
                            {servers
                                ? vt('{{count}} affiché(s)', { count: servers.items.length })
                                : vt("Chargement…")}
                        </p>
                    </div>
                </div>
                <ToolbarActions>
                    {rootAdmin && (
                        <AdminToggle>
                            <p css={tw`mr-3 text-xs font-medium text-neutral-300`}>
                                {showOnlyAdmin ? vt("Vue administrateur") : vt("Mes serveurs")}
                            </p>
                            <Switch
                                name={'show_all_servers'}
                                defaultChecked={showOnlyAdmin}
                                onChange={() => setShowOnlyAdmin((current) => !current)}
                            />
                        </AdminToggle>
                    )}
                    <ViewSwitcher aria-label={vt("Mode d’affichage")}>
                        <button
                            type={'button'}
                            className={currentDisplayMode === 'list' ? 'active' : undefined}
                            onClick={() => setDisplayMode('list')}
                            aria-label={vt("Afficher les serveurs en liste")}
                            aria-pressed={currentDisplayMode === 'list'}
                        >
                            <FontAwesomeIcon icon={faList} />
                        </button>
                        <button
                            type={'button'}
                            className={currentDisplayMode === 'grid' ? 'active' : undefined}
                            onClick={() => setDisplayMode('grid')}
                            aria-label={vt("Afficher les serveurs en grille")}
                            aria-pressed={currentDisplayMode === 'grid'}
                        >
                            <FontAwesomeIcon icon={faThLarge} />
                        </button>
                    </ViewSwitcher>
                </ToolbarActions>
            </DashboardToolbar>
            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            <ServerGrid $view={currentDisplayMode}>
                                {items.map((server) => (
                                    <ServerRow
                                        key={server.uuid}
                                        server={server}
                                        view={currentDisplayMode}
                                        onStatusChange={onServerStatusChange}
                                        design={design}
                                    />
                                ))}
                            </ServerGrid>
                        ) : (
                            <EmptyState>
                                <FontAwesomeIcon icon={faServer} css={tw`mb-4 text-3xl text-neutral-600`} />
                                <p css={tw`text-lg font-medium text-neutral-200`}>{vt("Aucun serveur à afficher")}</p>
                                <p css={tw`mt-2 text-sm text-neutral-400`}>
                                    {showOnlyAdmin
                                        ? vt("Aucun autre serveur n'est disponible dans la vue administrateur.")
                                        : vt("Aucun serveur n'est encore associé à votre compte.")}
                                </p>
                            </EmptyState>
                        )
                    }
                </Pagination>
            )}
        <AfterContent />
</PageContentBlock>
    );
};
