import React from 'react';
import { Route, Switch, useLocation } from 'react-router-dom';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import { NotFound } from '@/components/elements/ScreenBlock';
import TransitionRouter from '@/TransitionRouter';
import Spinner from '@/components/elements/Spinner';
import DesignStudio from '@/components/dashboard/design/DesignStudio';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import routes from '@/routers/routes';

export default () => {
    const location = useLocation();
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);

    return (
        <DashboardShell>
                <TransitionRouter>
                    <React.Suspense fallback={<Spinner centered />}>
                        <Switch location={location}>
                            <Route path={'/'} exact>
                                <DashboardContainer />
                            </Route>
                            <Route path={'/design'} exact>
                                {rootAdmin ? <DesignStudio /> : <NotFound />}
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
        </DashboardShell>
    );
};
