import DiscordButton from '@/components/elements/DiscordButton';
import TransferListener from '@/components/server/TransferListener';
import React, { useEffect, useState } from 'react';
import { Link, NavLink, Route, Switch, useRouteMatch } from 'react-router-dom';
import TransitionRouter from '@/TransitionRouter';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import { ServerContext } from '@/state/server';
import { CSSTransition } from 'react-transition-group';
import Can from '@/components/elements/Can';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import { httpErrorToHuman } from '@/api/http';
import http from '@/api/http';
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
    faServer,
    faSignOutAlt,
    faSlidersH,
    faTerminal,
    faUserCircle,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useLocation } from 'react-router';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import PermissionRoute from '@/components/elements/PermissionRoute';
import routes from '@/routers/routes';
import ServerShellHeader from '@/components/server/ServerShellHeader';
import { VINUS } from '@/theme';
import { ip } from '@/lib/formatters';

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

const navigationSections = [
    { label: 'Vue générale', paths: ['/'] },
    { label: 'Gestion', paths: ['/files', '/databases', '/users', '/backups'] },
    { label: 'Configuration', paths: ['/schedules', '/network', '/startup', '/settings'] },
    { label: 'Historique', paths: ['/activity'] },
];

const statusLabel = (status: string | null) => {
    if (status === 'running') return 'En ligne';
    if (status === 'starting') return 'Démarrage';
    if (status === 'stopping') return 'Arrêt en cours';
    return 'Hors ligne';
};

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();
    const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);
    const [error, setError] = useState('');

    const id = ServerContext.useStoreState((state) => state.server.data?.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const server = ServerContext.useStoreState((state) => state.server.data);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const inConflictState = ServerContext.useStoreState((state) => state.server.inConflictState);
    const getServer = ServerContext.useStoreActions((actions) => actions.server.getServer);
    const clearServerState = ServerContext.useStoreActions((actions) => actions.clearServerState);
    const allocation = server?.allocations.find((item) => item.isDefault);

    const to = (value: string, url = false) => {
        if (value === '/') return url ? match.url : match.path;
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    const logout = () => {
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
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

        return () => clearServerState();
    }, [match.params.id]);

    const renderRoute = (route: typeof routes.server[number]) => {
        const link = (
            <NavLink to={to(route.path, true)} exact={route.exact}>
                <FontAwesomeIcon icon={navigationIcons[route.path] || faTerminal} fixedWidth />
                <span>{route.name}</span>
            </NavLink>
        );

        return route.permission ? (
            <Can key={route.path} action={route.permission} matchAny>
                {link}
            </Can>
        ) : (
            <React.Fragment key={route.path}>{link}</React.Fragment>
        );
    };

    return (
        <React.Fragment key={'server-router'}>
            {!uuid || !id || !server ? (
                error ? (
                    <ServerError message={error} />
                ) : (
                    <Spinner size={'large'} centered />
                )
            ) : (
                <div className={'server-layout'}>
                    <a className={'skip-navigation'} href={'#main-content'}>
                        Aller au contenu
                    </a>
                    <CSSTransition timeout={150} classNames={'fade'} appear in>
                        <SubNavigation className={'server-sidebar'}>
                            <div>
                                <div className={'server-sidebar-brand'}>
                                    <Link to={'/'} aria-label={'Retour aux serveurs'}>
                                        <img src={VINUS.logo} alt={''} aria-hidden={'true'} />
                                        <div>
                                            <strong>{VINUS.name}</strong>
                                            <span>Panel de gestion</span>
                                        </div>
                                    </Link>
                                </div>

                                <div className={'server-sidebar-current'}>
                                    <div className={'server-sidebar-server-icon'}>
                                        <FontAwesomeIcon icon={faServer} />
                                    </div>
                                    <div className={'min-w-0'}>
                                        <strong>{server.name}</strong>
                                        <span className={`server-status server-status-${status || 'offline'}`}>
                                            {statusLabel(status)}
                                        </span>
                                        <small>
                                            {allocation
                                                ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}`
                                                : id}
                                        </small>
                                    </div>
                                </div>

                                <div className={'server-sidebar-links'}>
                                    {navigationSections.map((section) => (
                                        <div className={'server-sidebar-section'} key={section.label}>
                                            <p>{section.label}</p>
                                            {routes.server
                                                .filter((route) => !!route.name && section.paths.includes(route.path))
                                                .map(renderRoute)}
                                        </div>
                                    ))}
                                </div>

                                <div className={'server-sidebar-footer'}>
                  <DiscordButton />
                                    <Link to={'/'}>
                                        <FontAwesomeIcon icon={faServer} fixedWidth />
                                        <span>Tous les serveurs</span>
                                    </Link>
                                    <Link to={'/account'}>
                                        <FontAwesomeIcon icon={faUserCircle} fixedWidth />
                                        <span>Compte</span>
                                    </Link>
                                    {rootAdmin && (
                                        <a href={`/admin/servers/view/${server.internalId}`}>
                                            <FontAwesomeIcon icon={faExternalLinkAlt} fixedWidth />
                                            <span>Administration</span>
                                        </a>
                                    )}
                                    <button onClick={logout}>
                                        <FontAwesomeIcon icon={faSignOutAlt} fixedWidth />
                                        <span>Déconnexion</span>
                                    </button>
                                </div>
                            </div>
                        </SubNavigation>
                    </CSSTransition>
                    <div className={'server-workspace'}>
                        {location.pathname.replace(/\/$/, '') !== match.url.replace(/\/$/, '') && <ServerShellHeader />}
                        <main className={'server-route-content'} id={'main-content'} tabIndex={-1}>
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
