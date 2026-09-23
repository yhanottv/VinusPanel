import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import Can from '@/components/elements/Can';
import http from '@/api/http';
import routes from '@blueprint/extends/routers/routes';
import { vt } from '@/locales/translate';
import styles from './server.module.css';
export default function VinusCatalogEntry({ kind }: { kind: 'mods' | 'plugins' }) {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const admin = useStoreState(s => s.user.data!.rootAdmin);
    const [allowed, setAllowed] = useState<boolean | null>(null);
    const route = routes.server.find(r => r.identifier === 'vinuscatalog' && r.path === '/vinus-catalog');
    useEffect(() => {
        let active = true; setAllowed(null);
        if (!route || (route.adminOnly && !admin)) { setAllowed(false); return; }
        http.get('/api/client/extensions/blueprint/eggs', { params: { id: 'vinuscatalog' } }).then(({ data }) => {
            if (active) setAllowed(data.map(String).some((id: string) => id === '-1' || id === String(server.BlueprintFramework.eggId)));
        }).catch(() => { if (active) setAllowed(false); });
        return () => { active = false; };
    }, [server.uuid, route, admin]);
    if (allowed === null) return <p role="status">{vt('Chargement…')}</p>;
    if (!allowed || !route) return <p className={styles.empty}>{vt('Le catalogue n’est pas disponible pour cet egg.')}</p>;
    const Catalog = route.component as React.ComponentType<{ initialKind?: 'mods' | 'plugins'; embedded?: boolean }>;
    const content = <Catalog key={`${server.uuid}:${kind}`} initialKind={kind} embedded />;
    return route.permission ? <Can action={route.permission} matchAny>{content}</Can> : content;
}
