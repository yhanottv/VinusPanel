import * as React from 'react';
import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCogs, faServer, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import tw from 'twin.macro';
import styled from 'styled-components/macro';
import http from '@/api/http';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Avatar from '@/components/Avatar';
import { VINUS } from '@/theme';

const Navigation = styled.header`
    ${tw`sticky top-0 z-50 w-full`};
    background: rgba(8, 8, 9, 0.9);
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(22px) saturate(135%);

    &::after {
        content: '';
        ${tw`absolute bottom-0 left-0 h-px w-full`};
        background: linear-gradient(90deg, transparent, rgba(var(--vinus-accent-rgb), 0.48), transparent);
        opacity: 0.55;
    }
`;

const NavigationInner = styled.div`
    ${tw`mx-auto flex w-full items-center px-4`};
    max-width: 1800px;
    height: 4.5rem;
`;

const BrandMark = styled.span`
    ${tw`mr-3 flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-xl border`};
    background: linear-gradient(145deg, rgba(var(--vinus-accent-rgb), 0.18), rgba(10, 10, 11, 0.96));
    border-color: rgba(var(--vinus-accent-rgb), 0.32);
    box-shadow: 0 0 26px rgba(var(--vinus-accent-rgb), 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08);

    & > img {
        ${tw`h-9 w-9 object-contain`};
        filter: drop-shadow(0 0 6px rgba(var(--vinus-accent-rgb), 0.2));
    }
`;

const BrandName = styled.span`
    ${tw`truncate text-lg font-semibold text-neutral-100`};
    letter-spacing: -0.02em;

    @media (max-width: 479px) {
        ${tw`hidden`};
    }
`;

const WorkspaceNavigation = styled.nav`
    ${tw`hidden items-center md:flex`};

    a {
        ${tw`inline-flex items-center rounded-xl border border-transparent px-3.5 py-2 text-sm font-medium text-neutral-400 no-underline transition-all duration-150`};

        svg {
            ${tw`mr-2 text-neutral-500`};
        }

        &:hover,
        &.active {
            ${tw`text-neutral-100`};
            background: rgba(var(--vinus-accent-rgb), 0.08);
            border-color: rgba(var(--vinus-accent-rgb), 0.16);

            svg {
                color: var(--vinus-accent-soft);
            }
        }
    }
`;

const RightNavigation = styled.div`
    ${tw`ml-auto flex items-center gap-1.5`};

    & > a,
    & > button,
    & > .navigation-link {
        ${tw`flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-transparent p-0 text-neutral-400 no-underline transition-all duration-150`};
        background: rgba(255, 255, 255, 0.045);

        &:active,
        &:hover {
            ${tw`text-neutral-100`};
            border-color: rgba(var(--vinus-accent-rgb), 0.26);
            background: rgba(var(--vinus-accent-rgb), 0.09);
        }

        &.active {
            color: var(--vinus-accent-soft);
            border-color: rgba(var(--vinus-accent-rgb), 0.34);
            background: rgba(var(--vinus-accent-rgb), 0.13);
            box-shadow: 0 0 20px rgba(var(--vinus-accent-rgb), 0.09);
        }

        &:focus-visible {
            outline: 2px solid var(--vinus-accent);
            outline-offset: 2px;
        }
    }
`;

export default () => {
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
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
                <div id={'logo'} className={'min-w-0 flex-1'}>
                    <Link to={'/'} className={'inline-flex min-w-0 items-center no-underline'}>
                        <BrandMark>
                            <img src={VINUS.logo} alt={''} aria-hidden={'true'} />
                        </BrandMark>
                        <BrandName>{VINUS.name}</BrandName>
                    </Link>
                </div>
                <WorkspaceNavigation aria-label={'Navigation principale'}>
                    <NavLink to={'/'} exact>
                        <FontAwesomeIcon icon={faServer} />
                        Serveurs
                    </NavLink>
                </WorkspaceNavigation>
                <RightNavigation>
                    <SearchContainer />
                    {rootAdmin && (
                        <Tooltip placement={'bottom'} content={'Administration'}>
                            <a href={'/admin'} rel={'noreferrer'}>
                                <FontAwesomeIcon icon={faCogs} />
                            </a>
                        </Tooltip>
                    )}
                    <Tooltip placement={'bottom'} content={'Compte'}>
                        <NavLink to={'/account'}>
                            <span className={'flex items-center w-5 h-5'}>
                                <Avatar.User />
                            </span>
                        </NavLink>
                    </Tooltip>
                    <Tooltip placement={'bottom'} content={'Déconnexion'}>
                        <button onClick={onTriggerLogout}>
                            <FontAwesomeIcon icon={faSignOutAlt} />
                        </button>
                    </Tooltip>
                </RightNavigation>
            </NavigationInner>
        </Navigation>
    );
};
