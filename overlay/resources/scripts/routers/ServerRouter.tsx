import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import { useStoreState } from 'easy-peasy';
import SubNavigation from '@/components/elements/SubNavigation';
import InstallListener from '@/components/server/InstallListener';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArchive,
    faCalendarAlt,
    faCog,
    faDatabase,
    faExternalLinkAlt,
    faFolderOpen,
    faHistory,
    faNetworkWired,
    faSlidersH,
    faTerminal,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import ServerShellHeader from '@/components/server/ServerShellHeader';

const navigationIcons: Record<string, IconDefinition> = {
    '/': faTerminal,
    '/files': faFolderOpen,
    '/databases': faDatabase,
    '/schedules': faCalendarAlt,
    '/users': faUsers,
    '/backups': faArchive,
    '/network': faNetworkWired,
    '/startup': faSlidersH,
    '/settings': faCog,
    '/activity': faHistory,
};

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();

    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(
        () => () => {
            clearServerState();
        },
        []
    );

    useEffect(() => {
        setError('');

        getServer(match.params.id).catch((error) => {
            console.error(error);
            setError(httpErrorToHuman(error));
        });

        return () => {
            clearServerState();
        };
    }, [match.params.id]);

    return (
        <React.Fragment key={'server-router'}>
            <NavigationBar />
            {!uuid || !id ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <Spinner size={'large'} centered />
                )
            ) : (
                <div className={'server-layout'}>
                    <CSSTransition timeout={150} classNames={'fade'} appear in>
                        <SubNavigation className={'server-sidebar'}>
                            <div>
                                {routes.server
                                    .filter((route) => !!route.name)
                                    .map((route) =>
                                        route.permission ? (
                                            <Can key={route.path} action={route.permission} matchAny>
                                                <NavLink to={to(route.path, true)} exact={route.exact}>
                                                    <FontAwesomeIcon
                                                        icon={navigationIcons[route.path] || faTerminal}
                                                        fixedWidth
                                                    />
                                                    <span>{route.name}</span>
                                                </NavLink>
                                            </Can>
                                        ) : (
                                            <NavLink key={route.path} to={to(route.path, true)} exact={route.exact}>
                                                <FontAwesomeIcon
                                                    icon={navigationIcons[route.path] || faTerminal}
                                                    fixedWidth
                                                />
                                                <span>{route.name}</span>
                                            </NavLink>
                                        )
                                    )}
                                {rootAdmin && (
                                    // eslint-disable-next-line react/jsx-no-target-blank
                                    <a
                                        href={`/admin/servers/view/${serverId}`}
                                        target={'_blank'}
                                        title={'Administration du serveur'}
                                    >
                                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                                        <span>Administration</span>
                                    </a>
                                )}
                            </div>
                        </SubNavigation>
                    </CSSTransition>
                    <div className={'server-workspace'}>
                        <ServerShellHeader />
                        <main className={'server-route-content'}>
                            <InstallListener />
                            <TransferListener />
                            <WebsocketHandler />
                            {inConflictState &&
                            (!rootAdmin || (rootAdmin && !location.pathname.endsWith(`/server/${id}`))) ? (
                                <ConflictStateRenderer />
                            ) : (
                                <ErrorBoundary>
                                    <TransitionRouter>
                                        <Switch location={location}>
                                            {routes.server.map(({ path, permission, component: Component }) => (
                                                <PermissionRoute
                                                    key={path}
                                                    permission={permission}
                                                    path={to(path)}
                                                    exact
                                                >
                                                    <Spinner.Suspense>
                                                        <Component />
                                                    </Spinner.Suspense>
                                                </PermissionRoute>
                                            ))}
                                            <Route path={'*'} component={NotFound} />
                                        </Switch>
                                    </TransitionRouter>
                                </ErrorBoundary>
                            )}
                        </main>
                    </div>
                </div>
            )}
        </React.Fragment>
    );
};
