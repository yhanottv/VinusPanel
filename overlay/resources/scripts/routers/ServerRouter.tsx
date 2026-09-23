import React, { useEffect, useState } from 'react';
import { Route, Switch, useRouteMatch, useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ServerContext } from '@/state/server';
import DashboardShell from '@/components/dashboard/DashboardShell';
import ServerStatusBootstrap from '@/components/server/ServerStatusBootstrap';
import ServerNavigation from '@/components/server/ServerNavigation';
import ServerShellHeader from '@/components/server/ServerShellHeader';
import WebsocketHandler from '@/components/server/WebsocketHandler';
import InstallListener from '@/components/server/InstallListener';
import TransferListener from '@/components/server/TransferListener';
import ConflictStateRenderer from '@/components/server/ConflictStateRenderer';
import Spinner from '@/components/elements/Spinner';
import { NotFound, ServerError } from '@/components/elements/ScreenBlock';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import PermissionRoute from '@/components/elements/PermissionRoute';
import { httpErrorToHuman } from '@/api/http';
import routes from '@/routers/routes';
import styles from '@/components/server/server.module.css';
/* BLUEPRINT_IMPORTS */

export default () => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();
    const admin = useStoreState(s => s.user.data!.rootAdmin);
    const server = ServerContext.useStoreState(s => s.server.data);
    const conflict = ServerContext.useStoreState(s => s.server.inConflictState);
    const getServer = ServerContext.useStoreActions(a => a.server.getServer);
    const clear = ServerContext.useStoreActions(a => a.clearServerState);
    const [error, setError] = useState('');
    useEffect(() => {
        let active = true; setError('');
        getServer(match.params.id).catch(e => { if (active) setError(httpErrorToHuman(e)); });
        return () => { active = false; clear(); };
    }, [match.params.id]);
    if (!server) return error ? <ServerError message={error} /> : <Spinner size="large" centered />;
    const consolePath = location.pathname.replace(/\/$/, '') === match.url.replace(/\/$/, '');
    return <DashboardShell sidebar={<ServerNavigation /* BLUEPRINT_NAV */ />}>
        <div className={styles.route}>
            <InstallListener /><TransferListener /><WebsocketHandler /><ServerStatusBootstrap />
            <ServerShellHeader />
            {conflict && !(admin && consolePath) ? <ConflictStateRenderer /> : <ErrorBoundary>
                <Switch location={location}>
                    {routes.server.map(({ path, permission, component: Component }) => <PermissionRoute key={path} permission={permission} path={`${match.path}${path === '/' ? '' : path}`} exact><Spinner.Suspense><Component /></Spinner.Suspense></PermissionRoute>)}
                    <Route path="*" component={NotFound} />
                </Switch>
            </ErrorBoundary>}
        </div>
    </DashboardShell>;
};
