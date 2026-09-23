import PrivateValue from '@/components/elements/PrivateValue';
import React from 'react';
import { Link } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Can from '@/components/elements/Can';
import { ip } from '@/lib/formatters';
import { vt } from '@/locales/translate';
import { softwareName } from './SoftwareIcon';
import ServerResourceCards from './ServerResourceCards';
import useServerTelemetry from './useServerTelemetry';
import styles from './server.module.css';

export default function ServerOverview() {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const { stats, connected, status } = useServerTelemetry();
    const allocation = server.allocations.find(a => a.isDefault);
    const address = allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : '—';
    const base = `/server/${server.id}`;
    const uptime = !connected || !status ? '—' : status === 'offline' ? vt('À l’arrêt') : stats ? `${Math.floor(stats.uptime / 3600000)} h ${Math.floor(stats.uptime / 60000) % 60} min` : '—';
    return <PageContentBlock title={`${server.name} | ${vt('Aperçu')}`} className={styles.page}>
        <ServerResourceCards stats={stats} />
        <div className={styles.columns}>
            <section className={styles.panel}><h2>{vt('Infos du serveur')}</h2><dl className={styles.details}>
                <div><dt>{vt('Statut')}</dt><dd>{!connected || !status ? vt('Connexion…') : status === 'running' ? vt('En ligne') : status === 'offline' ? vt('Hors ligne') : vt('Transition')}</dd></div>
                <div><dt>{vt('Disponibilité')}</dt><dd>{uptime}</dd></div>
                <div><dt>{vt('Adresse')}</dt><dd><CopyOnClick text={address}><button type="button" title={vt('Copier l’adresse')}><PrivateValue>{address}</PrivateValue> ⧉</button></CopyOnClick></dd></div>
                <div><dt>{vt('Nœud')}</dt><dd>{server.node}</dd></div>
                <div><dt>{vt('ID du serveur')}</dt><dd><CopyOnClick text={server.id}><button type="button">{server.id} ⧉</button></CopyOnClick></dd></div>
            </dl></section>
            <section className={styles.panel}><h2>{vt('Configuration')}</h2><dl className={styles.details}>
                <div><dt>{vt('Logiciel')}</dt><dd>{softwareName(server.softwareProfile?.software)}</dd></div>
                <div><dt>{vt('Version Minecraft')}</dt><dd>{server.softwareProfile?.game_version || vt('Non déclarée')}</dd></div>
                <div><dt>{vt('Sauvegardes autorisées')}</dt><dd>{server.featureLimits.backups}</dd></div>
                <div><dt>{vt('Bases de données autorisées')}</dt><dd>{server.featureLimits.databases}</dd></div>
                <div><dt>{vt('Allocations autorisées')}</dt><dd>{server.featureLimits.allocations}</dd></div>
            </dl></section>
        </div>
        {server.description && <p className={styles.note}>{server.description}</p>}
        <div className={styles.shortcuts}>
            <Link to={base}>{vt('Ouvrir la console')} →</Link>
            <Can action="file.read"><Link to={`${base}/files`}>{vt('Gérer les fichiers')} →</Link></Can>
            <Can action="backup.read"><Link to={`${base}/backups`}>{vt('Sauvegardes')} →</Link></Can>
            <Can action="activity.read"><Link to={`${base}/activity`}>{vt('Activité')} →</Link></Can>
        </div>
    </PageContentBlock>;
}
