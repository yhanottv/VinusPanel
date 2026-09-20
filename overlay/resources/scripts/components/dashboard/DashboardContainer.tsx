import React, { useEffect, useState } from 'react';
import { Server } from '@/api/server/getServer';
import getServers from '@/api/getServers';
import ServerRow from '@/components/dashboard/ServerRow';
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

const DashboardHeader = styled.div`
    ${tw`mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between`};
`;

const DashboardTitle = styled.h1`
    ${tw`text-3xl font-semibold text-neutral-100`};
    letter-spacing: -0.025em;
`;

const DashboardDescription = styled.p`
    ${tw`mt-1 max-w-2xl text-sm text-neutral-400`};
`;

const DashboardControls = styled.div`
    ${tw`flex flex-wrap items-center gap-3`};
`;

const ServerCount = styled.span`
    ${tw`rounded-full border border-neutral-600 px-3 py-1 text-xs font-medium text-neutral-300`};
    background: rgba(18, 27, 36, 0.35);
`;

const EmptyState = styled.div`
    ${tw`rounded-lg border border-neutral-600 px-6 py-12 text-center`};
    background: rgba(45, 60, 73, 0.55);
`;

const ServerGrid = styled.div`
    ${tw`grid grid-cols-1 gap-4 xl:grid-cols-2`};
`;

export default () => {
    const { search } = useLocation();
    const defaultPage = Number(new URLSearchParams(search).get('page') || '1');

    const [page, setPage] = useState(!isNaN(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const uuid = useStoreState((state) => state.user.data!.uuid);
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [showOnlyAdmin, setShowOnlyAdmin] = usePersistedState(`${uuid}:show_all_servers`, false);

    const { data: servers, error } = useSWR<PaginatedResult<Server>>(
        ['/api/client/servers', showOnlyAdmin && rootAdmin, page],
        () => getServers({ page, type: showOnlyAdmin && rootAdmin ? 'admin' : undefined })
    );

    useEffect(() => {
        setPage(1);
    }, [showOnlyAdmin]);

    useEffect(() => {
        if (!servers) return;
        if (servers.pagination.currentPage > 1 && !servers.items.length) {
            setPage(1);
        }
    }, [servers?.pagination.currentPage]);

    useEffect(() => {
        // Don't use react-router to handle changing this part of the URL, otherwise it
        // triggers a needless re-render. We just want to track this in the URL incase the
        // user refreshes the page.
        window.history.replaceState(null, document.title, `/${page <= 1 ? '' : `?page=${page}`}`);
    }, [page]);

    useEffect(() => {
        if (error) clearAndAddHttpError({ key: 'dashboard', error });
        if (!error) clearFlashes('dashboard');
    }, [error]);

    return (
        <PageContentBlock title={'Dashboard'} showFlashKey={'dashboard'}>
            <DashboardHeader>
                <div>
                    <DashboardTitle>Vos serveurs</DashboardTitle>
                    <DashboardDescription>
                        Surveillez l&apos;état et les ressources de vos instances, puis ouvrez un serveur pour le gérer.
                    </DashboardDescription>
                </div>
                <DashboardControls>
                    {servers && (
                        <ServerCount>
                            {servers.items.length} serveur{servers.items.length > 1 ? 's' : ''} affiché
                            {servers.items.length > 1 ? 's' : ''}
                        </ServerCount>
                    )}
                    {rootAdmin && (
                        <div css={tw`flex items-center rounded-full border border-neutral-600 px-3 py-1.5`}>
                            <p css={tw`mr-3 text-xs font-medium text-neutral-300`}>
                                {showOnlyAdmin ? 'Serveurs administrés' : 'Mes serveurs'}
                            </p>
                            <Switch
                                name={'show_all_servers'}
                                defaultChecked={showOnlyAdmin}
                                onChange={() => setShowOnlyAdmin((s) => !s)}
                            />
                        </div>
                    )}
                </DashboardControls>
            </DashboardHeader>
            {!servers ? (
                <Spinner centered size={'large'} />
            ) : (
                <Pagination data={servers} onPageSelect={setPage}>
                    {({ items }) =>
                        items.length > 0 ? (
                            <ServerGrid>
                                {items.map((server) => (
                                    <ServerRow key={server.uuid} server={server} />
                                ))}
                            </ServerGrid>
                        ) : (
                            <EmptyState>
                                <p css={tw`text-lg font-medium text-neutral-200`}>Aucun serveur à afficher</p>
                                <p css={tw`mt-1 text-sm text-neutral-400`}>
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
