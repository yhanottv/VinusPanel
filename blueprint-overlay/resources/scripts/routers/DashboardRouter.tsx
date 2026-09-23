import { vt } from '@/locales/translate';
import { NavigationRouter } from '@blueprint/extends/routers/DashboardRouter';
import BeforeSubNavigation from '@blueprint/components/Navigation/SubNavigation/BeforeSubNavigation';
import AdditionalAccountItems from '@blueprint/components/Navigation/SubNavigation/AdditionalAccountItems';
import AfterSubNavigation from '@blueprint/components/Navigation/SubNavigation/AfterSubNavigation';
import blueprintRoutes from '@blueprint/extends/routers/routes';
import { useStoreState } from 'easy-peasy';
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import DesignStudio from '@/components/dashboard/design/DesignStudio';
import { NotFound } from '@/components/elements/ScreenBlock';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faFingerprint,
  faKey,
  faPalette,
  faShieldAlt,
  faTerminal,
  faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
import NavigationBar from '@/components/NavigationBar';
import routes from '@/routers/routes';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

const Shell = styled.div`
  ${tw`min-h-screen lg:flex lg:gap-0 lg:p-3`};
`;

const Workspace = styled.main`
  ${tw`min-w-0 flex-1`};

  @media (min-width: 1024px) {
    min-height: calc(100vh - 1.5rem);
    padding: 0 0.5rem;
    background: transparent;
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

const accountIcons: Record<string, any> = {
  '/': faUserCircle,
  '/profile': faPalette,
  '/api': faKey,
  '/ssh': faTerminal,
  '/activity': faFingerprint,
};

export default () => {
  const location = useLocation();
  const rootAdmin = useStoreState((state) => state.user.data!.rootAdmin);

  return (
    <Shell className={'app-shell'}>
      <a className={'skip-navigation'} href={'#main-content'}>{vt("Aller au contenu")}</a>
      <NavigationBar />
      <Workspace className={'app-workspace'} id={'main-content'} tabIndex={-1}>
        {location.pathname.startsWith('/account') && (
          <AccountNavigation aria-label={vt("Navigation du compte")}>
            <BeforeSubNavigation />
            {routes.account
              .filter((route) => !!route.name)
              .map(({ path, name, exact = false }) => (
                <NavLink key={path} to={`/account/${path}`.replace('//', '/')} exact={exact}>
                  <FontAwesomeIcon icon={accountIcons[path] || faShieldAlt} />
                  {name}
                </NavLink>
              ))}
            {blueprintRoutes.account
              .filter((route) => route.name && (!route.adminOnly || rootAdmin))
              .map((route) => (
                <NavLink key={route.path} to={`/account/${route.path}`.replace('//', '/')} exact>
                  {route.name}
                </NavLink>
              ))}
            <AdditionalAccountItems />
            <AfterSubNavigation />
          </AccountNavigation>
        )}
        {location.pathname.replace(/\/$/, '') === '/design'
          ? (rootAdmin ? <DesignStudio /> : <NotFound />)
          : <NavigationRouter />}
      </Workspace>
    </Shell>
  );
};
