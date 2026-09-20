import React from 'react';
import { Link, useLocation, useRouteMatch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faCircle, faEthernet, faServer } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import { ip } from '@/lib/formatters';
import Can from '@/components/elements/Can';
import PowerButtons from '@/components/server/console/PowerButtons';
import routes from '@/routers/routes';

const Header = styled.header`
    ${tw`relative mb-6 overflow-hidden border-b pb-6`};
    border-color: rgba(255, 255, 255, 0.08);

    &::after {
        content: '';
        ${tw`pointer-events-none absolute -bottom-24 right-5 h-64 w-64`};
        background: url('/assets/images/vinus/eagle.png') center / contain no-repeat;
        opacity: 0.04;
    }
`;

const Breadcrumb = styled.div`
    ${tw`relative z-10 mb-5 flex items-center text-xs text-neutral-500`};

    a {
        ${tw`inline-flex items-center text-neutral-400 no-underline hover:text-primary-300`};
    }
`;

const HeaderLayout = styled.div`
    ${tw`relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between`};
`;

const Identity = styled.div`
    ${tw`flex min-w-0 items-start`};
`;

const ServerMark = styled.div`
    ${tw`mr-4 flex h-14 w-14 flex-none items-center justify-center rounded-2xl border text-primary-300`};
    background: rgba(5, 10, 16, 0.46);
    border-color: rgba(var(--vinus-accent-rgb), 0.24);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 0 28px rgba(var(--vinus-accent-rgb), 0.08);
`;

const Status = styled.span<{ $color: string }>`
    ${tw`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium`};
    color: ${({ $color }) => $color};
    background: ${({ $color }) => `${$color}14`};
    border-color: ${({ $color }) => `${$color}45`};

    svg {
        ${tw`mr-1.5 text-[0.45rem]`};
        filter: drop-shadow(0 0 5px ${({ $color }) => $color});
    }
`;

const Meta = styled.div`
    ${tw`mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400`};

    span {
        ${tw`inline-flex items-center`};
    }
`;

const HeaderActions = styled.div`
    ${tw`flex-none`};

    .server-shell-power {
        ${tw`grid grid-cols-3 gap-2`};

        button {
            ${tw`whitespace-nowrap`};
        }
    }

    @media (max-width: 639px) {
        ${tw`w-full`};

        .server-shell-power button {
            ${tw`min-w-0 px-2 text-xs`};
        }
    }
`;

const statusDetails = (status: string | null) => {
    if (status === 'running') return { label: 'En ligne', color: '#43d6a3' };
    if (status === 'offline' || status === null) return { label: 'Hors ligne', color: '#fb7185' };
    if (status === 'starting') return { label: 'Démarrage', color: '#fbbf24' };
    if (status === 'stopping') return { label: 'Arrêt en cours', color: '#fbbf24' };
    return { label: 'Connexion…', color: '#94a3b8' };
};

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();
    const server = ServerContext.useStoreState((state) => state.server.data!);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const allocation = server.allocations.find((item) => item.isDefault);
    const relativePath = location.pathname.slice(match.url.length) || '/';
    const route = routes.server
        .filter((item) => !!item.name)
        .filter((item) => item.path === '/' || relativePath.startsWith(item.path))
        .sort((left, right) => right.path.length - left.path.length)[0];
    const currentStatus = statusDetails(status);

    return (
        <Header>
            <Breadcrumb>
                <Link to={'/'}>
                    <FontAwesomeIcon icon={faChevronLeft} css={tw`mr-1.5`} />
                    Tous les serveurs
                </Link>
                <span css={tw`mx-2 text-neutral-700`}>/</span>
                <span>{route?.name || 'Serveur'}</span>
            </Breadcrumb>
            <HeaderLayout>
                <Identity>
                    <ServerMark>
                        <FontAwesomeIcon icon={faServer} />
                    </ServerMark>
                    <div css={tw`min-w-0`}>
                        <div css={tw`flex flex-wrap items-center gap-2`}>
                            <h1 css={tw`truncate text-3xl font-semibold text-neutral-50 sm:text-5xl`}>{server.name}</h1>
                            <Status $color={currentStatus.color} aria-live={'polite'}>
                                <FontAwesomeIcon icon={faCircle} />
                                {currentStatus.label}
                            </Status>
                        </div>
                        <p css={tw`mt-1 line-clamp-1 max-w-2xl text-sm text-neutral-400`}>
                            {server.description || 'Instance gérée depuis votre centre de contrôle VinusPanel.'}
                        </p>
                        <Meta>
                            <span>
                                <FontAwesomeIcon icon={faEthernet} css={tw`mr-2 text-primary-300`} />
                                {allocation
                                    ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}`
                                    : 'Aucune allocation principale'}
                            </span>
                            <span>ID&nbsp; {server.id}</span>
                        </Meta>
                    </div>
                </Identity>
                <HeaderActions>
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons className={'server-shell-power'} />
                    </Can>
                </HeaderActions>
            </HeaderLayout>
        </Header>
    );
};
