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
import Icon, { DashboardIconName } from '@/components/dashboard/DashboardIcon';

function Shortcut({ to, icon, title, description }: { to: string; icon: DashboardIconName; title: string; description: string }) {
    return <Link to={to} className={styles.shortcut}>
        <span className={styles.shortcutIcon}><Icon name={icon}/></span>
        <span className={styles.shortcutText}><strong>{vt(title)}</strong><small>{vt(description)}</small></span>
        <Icon name="chevron" className={styles.shortcutArrow}/>
    </Link>;
}

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
        <nav className={styles.shortcuts} aria-label={vt('Raccourcis du serveur')}>
            <Shortcut to={base} icon="terminal" title="Ouvrir la console" description="Commandes et journaux en direct"/>
            <Can action="file.read"><Shortcut to={`${base}/files`} icon="folder" title="Gérer les fichiers" description="Parcourir et modifier les fichiers"/></Can>
            <Can action="backup.read"><Shortcut to={`${base}/backups`} icon="archive" title="Sauvegardes" description="Créer et restaurer des sauvegardes"/></Can>
            <Can action="activity.read"><Shortcut to={`${base}/activity`} icon="history" title="Activité" description="Consulter les actions récentes"/></Can>
        </nav>
    </PageContentBlock>;
}
