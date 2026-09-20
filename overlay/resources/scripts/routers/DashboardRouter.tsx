import React from 'react';
import { NavLink, Route, Switch, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faShieldAlt, faTerminal, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import NavigationBar from '@/components/NavigationBar';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import Spinner from '@/components/elements/Spinner';
import routes from '@/routers/routes';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

const Shell = styled.div`
    ${tw`min-h-screen lg:flex lg:gap-3 lg:p-3`};
`;

const Workspace = styled.main`
    ${tw`min-w-0 flex-1`};

    @media (min-width: 1024px) {
        min-height: calc(100vh - 1.5rem);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 1.25rem;
        background: rgba(10, 10, 13, 0.72);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
    }
`;

const AccountNavigation = styled.nav`
    ${tw`mx-4 mt-5 flex items-center gap-1 overflow-x-auto rounded-xl border p-1 sm:mx-6 lg:mx-8 lg:mt-7`};
    background: rgba(255, 255, 255, 0.035);
    border-color: rgba(255, 255, 255, 0.07);

    a {
        ${tw`inline-flex flex-none items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium text-neutral-400 no-underline transition-colors`};

        &:hover {
            ${tw`text-neutral-100`};
            background: rgba(255, 255, 255, 0.05);
        }

        &.active {
            color: #fff;
            background: rgba(var(--vinus-accent-rgb), 0.14);
            box-shadow: inset 0 0 0 1px rgba(var(--vinus-accent-rgb), 0.18);
        }
    }
`;

const accountIcons = [faUserCircle, faKey, faTerminal, faShieldAlt];

export default () => {
    const location = useLocation();

    return (
        <Shell className={'app-shell'}>
            <NavigationBar />
            <Workspace className={'app-workspace'}>
                {location.pathname.startsWith('/account') && (
                    <AccountNavigation aria-label={'Navigation du compte'}>
                        {routes.account
                            .filter((route) => !!route.name)
                            .map(({ path, name, exact = false }, index) => (
                                <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                                    <FontAwesomeIcon icon={accountIcons[index] || faUserCircle} />
                                    {name}
                                </NavLink>
                            ))}
                    </AccountNavigation>
                )}
                <TransitionRouter>
                    <React.Suspense fallback={<Spinner centered />}>
                        <Switch location={location}>
                            <Route path={'/'} exact>
                                <DashboardContainer />
                            </Route>
                            {routes.account.map(({ path, component: Component }) => (
                                <Route key={path} path={`/account/${path}`.replace('//', '/')} exact>
                                    <Component />
                                </Route>
                            ))}
                            <Route path={'*'}>
                                <NotFound />
                            </Route>
                        </Switch>
                    </React.Suspense>
                </TransitionRouter>
            </Workspace>
        </Shell>
    );
};
