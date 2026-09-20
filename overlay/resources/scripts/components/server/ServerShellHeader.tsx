import React from 'react';
import { Link, useLocation, useRouteMatch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faCircle, faEthernet } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import { ServerContext } from '@/state/server';
import { ip } from '@/lib/formatters';
import Can from '@/components/elements/Can';
import PowerButtons from '@/components/server/console/PowerButtons';
import routes from '@/routers/routes';

const Header = styled.header`
    ${tw`relative mb-6 border-b pb-5`};
    border-color: rgba(255, 255, 255, 0.08);
`;

const Breadcrumb = styled.div`
    ${tw`mb-4 flex items-center text-xs text-neutral-500`};

    a {
        ${tw`inline-flex items-center text-neutral-400 no-underline hover:text-primary-300`};
    }
`;

const HeaderLayout = styled.div`
    ${tw`flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between`};
`;

const Identity = styled.div`
    ${tw`min-w-0`};
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
    ${tw`mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400`};

    span {
        ${tw`inline-flex items-center`};
    }
`;

const HeaderActions = styled.div`
    ${tw`flex-none`};

    .server-shell-power {
        ${tw`grid grid-cols-3 gap-2`};

        button {
            ${tw`min-h-[2.5rem] whitespace-nowrap rounded-lg border px-3 text-xs font-semibold`};
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
                    <p css={tw`mb-1 truncate text-xs font-semibold uppercase tracking-[0.16em] text-primary-300`}>
                        {server.name}
                    </p>
                    <div css={tw`flex flex-wrap items-center gap-3`}>
                        <h1 css={tw`text-2xl font-semibold text-neutral-50 sm:text-3xl`}>
                            {route?.name || 'Serveur'}
                        </h1>
                        <Status $color={currentStatus.color} aria-live={'polite'}>
                            <FontAwesomeIcon icon={faCircle} />
                            {currentStatus.label}
                        </Status>
                    </div>
                    <Meta>
                        <span>
                            <FontAwesomeIcon icon={faEthernet} css={tw`mr-2 text-primary-300`} />
                            {allocation
                                ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}`
                                : 'Aucune allocation principale'}
                        </span>
                        <span>{server.description || `Identifiant ${server.id}`}</span>
                    </Meta>
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
