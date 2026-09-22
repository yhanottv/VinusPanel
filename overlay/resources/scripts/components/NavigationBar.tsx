import { vt } from '@/locales/translate';
import DiscordButton from '@/components/elements/DiscordButton';
import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faServer, faSignOutAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Avatar from '@/components/Avatar';
import { VINUS } from '@/theme';
import useProfileAppearance from '@/components/dashboard/profile/useProfileAppearance';

const Navigation = styled.aside`
    ${tw`relative z-50 flex w-full flex-none border-b lg:sticky lg:top-3 lg:h-[calc(100vh-1.5rem)] lg:w-[15rem] lg:flex-col lg:overflow-y-auto lg:rounded-xl lg:border`};

    @media (min-width: 1024px) {
        height: calc(100vh - 1.5rem);
        align-self: start;
    }
    background: var(--vinus-glass-navigation);
    backdrop-filter: blur(28px) saturate(115%);
    -webkit-backdrop-filter: blur(28px) saturate(115%);
    border-color: rgba(255, 255, 255, 0.065);
    box-shadow: var(--vinus-navigation-shadow);
`;

const NavigationInner = styled.div`
    ${tw`flex h-[4.5rem] w-full items-center px-4 lg:h-full lg:flex-col lg:items-stretch lg:px-3 lg:py-5`};
`;

const Brand = styled(Link)`
    ${tw`flex min-w-0 items-center no-underline lg:pb-5`};

    @media (min-width: 1024px) {
        border-bottom: 1px solid rgba(255, 255, 255, 0.065);
    }
`;

const BrandMark = styled.span`
    ${tw`mr-3 flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-xl border`};
    background: rgba(var(--vinus-accent-rgb), 0.1);
    border-color: rgba(var(--vinus-accent-rgb), 0.22);

    img {
        ${tw`h-9 w-9 object-contain`};
    }
`;

const BrandCopy = styled.span`
    ${tw`min-w-0`};

    strong,
    small {
        ${tw`block truncate`};
    }

    strong {
        ${tw`text-base font-semibold text-neutral-50`};
    }

    small {
        ${tw`mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-neutral-500`};
    }

    @media (max-width: 479px) {
        ${tw`hidden`};
    }
`;

const SectionLabel = styled.p`
    ${tw`mb-2 mt-6 hidden px-3 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-neutral-600 lg:block`};
`;

const MainNavigation = styled.nav`
    ${tw`ml-auto flex items-center gap-1 lg:ml-0 lg:flex-col lg:items-stretch`};

    a,
    .search-entry > button,
    .search-entry > div > button {
        ${tw`flex h-10 items-center justify-center rounded-lg border border-transparent px-3 text-sm font-medium text-neutral-400 no-underline transition-all lg:w-full lg:justify-start`};

        svg {
            ${tw`lg:mr-3`};
        }

        span {
            ${tw`hidden lg:inline`};
        }

        &:hover,
        &.active {
            ${tw`text-neutral-100`};
            background: rgba(255, 255, 255, 0.035);
        }

        &.active {
            border-color: rgba(var(--vinus-accent-rgb), 0.16);
                box-shadow: inset 2px 0 0 #ff7a1a;
            background: rgba(var(--vinus-accent-rgb), 0.065);

            svg {
                color: #ff9b52;
            }
        }

        &:focus-visible {
            outline: 2px solid var(--vinus-accent);
            outline-offset: 2px;
        }
    }

    .search-entry {
        ${tw`lg:w-full`};

        & > div {
            ${tw`lg:w-full`};
        }
    }
`;

const Footer = styled.div`
    ${tw`ml-1 flex items-center gap-1 lg:mt-auto lg:ml-0 lg:block lg:border-t lg:pt-4`};
    border-color: rgba(255, 255, 255, 0.065);
`;

const UserCard = styled(NavLink)`
    ${tw`hidden min-w-0 items-center rounded-xl p-2 no-underline transition-colors lg:flex`};

    &:hover {
        background: rgba(255, 255, 255, 0.035);
    }

    .avatar-wrap {
        ${tw`mr-3 flex h-9 w-9 flex-none items-center justify-center overflow-hidden rounded-lg`};
    }

    strong,
    small {
        ${tw`block truncate`};
    }

    strong {
        ${tw`text-sm font-medium text-neutral-100`};
    }

    small {
        ${tw`mt-0.5 text-xs text-neutral-500`};
    }
`;

const LogoutButton = styled.button`
    ${tw`flex h-10 w-10 items-center justify-center rounded-lg text-neutral-500 transition-colors lg:mt-2 lg:w-full lg:justify-start lg:px-3`};

    span {
        ${tw`hidden lg:ml-3 lg:inline`};
    }

    &:hover {
        ${tw`text-red-300`};
        background: rgba(244, 63, 94, 0.08);
    }
`;

export default () => {
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const { appearance } = useProfileAppearance(user.uuid);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    return (
        <Navigation>
            <SpinnerOverlay visible={isLoggingOut} />
            <NavigationInner>
                <Brand to={'/'}>
                    <BrandMark>
                        <img src={VINUS.logo} alt={''} aria-hidden={'true'} />
                    </BrandMark>
                    <BrandCopy>
                        <strong>{VINUS.name}</strong>
                        <small>{vt("Panel de gestion")}</small>
                    </BrandCopy>
                </Brand>
                <SectionLabel>{vt("Espace de travail")}</SectionLabel>
                <MainNavigation aria-label={vt("Navigation principale")}>
                    <NavLink to={'/'} exact aria-label={vt("Serveurs")}>
                        <FontAwesomeIcon icon={faServer} fixedWidth />
                        <span>{vt("Serveurs")}</span>
                    </NavLink>
                    <NavLink to={'/account'} aria-label={vt("Compte")}>
                        <FontAwesomeIcon icon={faUserCircle} fixedWidth />
                        <span>{vt("Compte")}</span>
                    </NavLink>
                    {user.rootAdmin && (
                        <a href={'/admin'} aria-label={'Administration'}>
                            <FontAwesomeIcon icon={faCogs} fixedWidth />
                            <span>Administration</span>
                        </a>
                    )}
                    <div className={'search-entry'} aria-label={vt("Rechercher")}>
                        <SearchContainer />
                    </div>
                </MainNavigation>
                <Footer>
                    <DiscordButton />
                    <UserCard to={'/account/profile'}>
                        <span className={'avatar-wrap'}>
                            <Avatar.User />
                        </span>
                        <span className={'min-w-0'}>
                            <strong>{appearance.displayName || user.username}</strong>
                            <small>{user.email}</small>
                        </span>
                    </UserCard>
                    <LogoutButton onClick={onTriggerLogout} aria-label={vt("Déconnexion")}>
                        <FontAwesomeIcon icon={faSignOutAlt} fixedWidth />
                        <span>{vt("Déconnexion")}</span>
                    </LogoutButton>
                </Footer>
            </NavigationInner>
        </Navigation>
    );
};
