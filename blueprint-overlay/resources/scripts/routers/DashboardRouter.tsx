import React from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { NavigationRouter } from '@blueprint/extends/routers/DashboardRouter';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DesignStudio from '@/components/dashboard/design/DesignStudio';
import { NotFound } from '@/components/elements/ScreenBlock';

export default () => {
    const location = useLocation();
    const rootAdmin = useStoreState(state => state.user.data!.rootAdmin);
    return <DashboardShell>
        {location.pathname.replace(/\/$/, '') === '/design'
            ? (rootAdmin ? <DesignStudio /> : <NotFound />)
            : <NavigationRouter />}
    </DashboardShell>;
};
