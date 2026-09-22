import React, { useEffect, useState } from 'react';
import { NavLink, useRouteMatch } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPuzzlePiece } from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import http from '@/api/http';
import routes from '@blueprint/extends/routers/routes';

export default () => {
  const match = useRouteMatch();
  const admin = useStoreState((state) => state.user.data!.rootAdmin);
  const egg = ServerContext.useStoreState((state) => state.server.data?.BlueprintFramework.eggId);
  const [allowed, setAllowed] = useState<Record<string, string[]>>({});
  useEffect(() => {
    let active = true;
    Promise.all(
      [...new Set(routes.server.map((route) => route.identifier))].map(async (id) => {
        const { data } = await http.get('/api/client/extensions/blueprint/eggs', { params: { id } });
        return [id, data.map(String)] as const;
      })
    )
      .then((items) => {
        if (active) setAllowed(Object.fromEntries(items));
      })
      .catch(() => {
        if (active) setAllowed({});
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <div className={'server-sidebar-section'}><p>EXTENSIONS</p><div>
      {routes.server
        .filter(
          (route) =>
            route.name &&
            (!route.adminOnly || admin) &&
            (allowed[route.identifier]?.includes('-1') || allowed[route.identifier]?.includes(String(egg)))
        )
        .map((route) => {
          const link = (
            <NavLink to={`${match.url.replace(/\/$/, '')}/${route.path.replace(/^\//, '')}`} exact={route.exact}>
              <FontAwesomeIcon icon={faPuzzlePiece} fixedWidth />
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
        })}
    </div></div>
  );
};
