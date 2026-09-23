import PrivateValue from '@/components/elements/PrivateValue';
import React from 'react';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from './Console';
import StatGraphs from './StatGraphs';
import ServerResourceCards from '../ServerResourceCards';
import useServerTelemetry from '../useServerTelemetry';
import { ip } from '@/lib/formatters';
import { vt } from '@/locales/translate';
import styles from '../server.module.css';
/* HOOK_IMPORTS */
export default () => {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const { stats } = useServerTelemetry();
    const allocation = server.allocations.find(a => a.isDefault);
    const address = allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : null;
    return <PageContentBlock title={`${server.name} | Console`} className={styles.page}>
        {/* BEFORE */}
        <div className={styles.consoleGrid}>
            <section aria-label="Console"><Spinner.Suspense><Console /></Spinner.Suspense></section>
            <aside aria-label={vt('Ressources du serveur')}>
                {address && <CopyOnClick text={address}><button className={styles.connectCard} type="button"><small>{vt('Copier l’adresse')} ⧉</small><strong><PrivateValue>{address}</PrivateValue></strong><small>{vt('Connectez votre client à cette adresse.')}</small></button></CopyOnClick>}
                {/* BEFORE_INFO */}<ServerResourceCards stats={stats} vertical />{/* AFTER_INFO */}
            </aside>
        </div>
        <section className={styles.charts} aria-label={vt('Historique des ressources')}><StatGraphs /></section>
        <Features enabled={server.eggFeatures} />{/* AFTER */}
    </PageContentBlock>;
};
