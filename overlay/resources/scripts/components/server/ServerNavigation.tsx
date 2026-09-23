import NavLink from '@/components/dashboard/design/DesignNavLink';
import { useDesign } from '@/designRuntime';
import PrivateValue from '@/components/elements/PrivateValue';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThLarge, faTerminal, faFolderOpen, faSlidersH, faCog, faUsers, faPuzzlePiece, faCubes, faGlobe, faDatabase, faArchive, faNetworkWired, faCalendarAlt, faHistory, faLifeRing } from '@fortawesome/free-solid-svg-icons';
import Icon from '@/components/dashboard/DashboardIcon';
import dash from '@/components/dashboard/dashboard.module.css';
import styles from './server.module.css';
import SoftwareIcon from './SoftwareIcon';
import { VINUS } from '@/theme';
import { ip } from '@/lib/formatters';
import { vt } from '@/locales/translate';

const sections = [
    { name: 'Essentiels', items: [
        { path: '/overview', name: 'Aperçu', icon: faThLarge, permission: null },
        { path: '', name: 'Console', icon: faTerminal, permission: null },
        { path: '/files', name: 'Fichiers', icon: faFolderOpen, permission: 'file.*' },
        { path: '/support', name: 'Assistance', icon: faLifeRing, permission: null },
        { path: '/startup', name: 'Démarrage', icon: faSlidersH, permission: 'startup.*' },
        { path: '/settings', name: 'Paramètres', icon: faCog, permission: ['settings.*', 'file.sftp'] },
    ] },
    { name: 'Outils MC', items: [
        { path: '/players', name: 'Joueurs', icon: faUsers, permission: 'file.read-content' },
        { path: '/plugins', name: 'Plugins', icon: faPuzzlePiece, permission: 'file.read' },
        { path: '/mods', name: 'Mods', icon: faCubes, permission: 'file.read' },
        { path: '/modpacks', name: 'Modpacks', icon: faArchive, permission: 'file.read' },
        { path: '/version', name: 'Version', icon: faSlidersH, permission: 'startup.read' },
        { path: '/properties', name: 'Propriétés', icon: faCog, permission: 'file.read-content' },
        { path: '/worlds', name: 'Mondes', icon: faGlobe, permission: 'file.read' },
        { path: '/world-viewer', name: 'World Viewer', icon: faGlobe, permission: 'file.read-content' },
    ] },
    { name: 'Gestion', items: [
        { path: '/databases', name: 'Bases de données', icon: faDatabase, permission: 'database.*' },
        { path: '/backups', name: 'Sauvegardes', icon: faArchive, permission: 'backup.*' },
        { path: '/network', name: 'Réseau', icon: faNetworkWired, permission: 'allocation.*' },
        { path: '/schedules', name: 'Planifications', icon: faCalendarAlt, permission: 'schedule.*' },
        { path: '/users', name: 'Utilisateurs', icon: faUsers, permission: 'user.*' },
        { path: '/activity', name: 'Activité', icon: faHistory, permission: 'activity.*' },
    ] },
];
export default function ServerNavigation({ before, after, extensions }: { before?: React.ReactNode; after?: React.ReactNode; extensions?: React.ReactNode }) {
    const design = useDesign();
    const server = ServerContext.useStoreState(s => s.server.data!);
    const admin = useStoreState(s => s.user.data!.rootAdmin);
    const [mobile, setMobile] = useState(false);
    const [closed, setClosed] = useState<string[]>([]);
    const location = useLocation();
    const allocation = server.allocations.find(a => a.isDefault);
    const address = allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : '';
    const profile = server.softwareProfile;
    const proxy = ['velocity', 'velocity_ctd', 'bungeecord', 'waterfall', 'loohplimbo', 'nanolimbo'].includes(profile?.software || '');
    useEffect(() => setMobile(false), [location.pathname, location.search]);
    useEffect(() => {
        const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobile(false); };
        document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape);
    }, []);
    return <aside className={dash.sidebar} data-open={mobile}>
        <Link className={dash.brand} to="/" aria-label={design.brand_name}><img className="vinus-brand-dark" src={design.logo} alt={design.options.logo_alt} /><img className="vinus-brand-light" src={design.options.logo_light || design.logo} alt={design.options.logo_alt} /><img className="vinus-brand-square" src={design.options.logo_square || design.logo} alt={design.options.logo_alt} /><strong>{design.brand_name}</strong></Link>
        <button className={dash.mobileToggle} type="button" aria-label={vt(mobile ? 'Fermer le menu' : 'Ouvrir le menu')} aria-expanded={mobile} aria-controls="server-navigation" onClick={() => setMobile(!mobile)}><Icon name={mobile ? 'close' : 'menu'} /></button>
        <nav className={dash.nav} id="server-navigation" aria-label={vt('Sections du serveur')}>
            <Link to="/" className={styles.backLink}>‹ {vt('Tableau de bord')}</Link>
            <div className={styles.sidebarIdentity}><SoftwareIcon software={profile?.software} /><div><strong title={server.name}>{server.name}</strong><small>{server.node}</small></div></div>
            {address && <CopyOnClick text={address}><button className={styles.sidebarAddress} type="button" title={vt('Copier l’adresse')}><PrivateValue>{address}</PrivateValue> ⧉</button></CopyOnClick>}
            {before}
            {sections.filter(section => section.name !== 'Outils MC' || !!profile?.software).map((section, index) => {
                const items = section.items.filter(item => {
                    if (item.path === '/mods') return !!profile?.categories.mods;
                    if (item.path === '/plugins') return !!profile?.categories.plugins;
                    return !proxy || !['/players', '/properties', '/worlds', '/world-viewer', '/modpacks'].includes(item.path);
                });
                return <React.Fragment key={section.name}>
                    <button className={dash.sectionToggle} type="button" aria-expanded={!closed.includes(section.name)} aria-controls={`server-section-${index}`} onClick={() => setClosed(s => s.includes(section.name) ? s.filter(x => x !== section.name) : [...s, section.name])}>{vt(section.name)}<Icon name="down" /></button>
                    {!closed.includes(section.name) && <div className={dash.navGroup} id={`server-section-${index}`}>{items.map(item => {
                        const link = <NavLink to={`/server/${server.id}${item.path}`} exact={!item.path}><FontAwesomeIcon icon={item.icon} fixedWidth /><span>{vt(item.name)}</span></NavLink>;
                        return item.permission ? <Can key={item.path} action={item.permission} matchAny>{link}</Can> : <React.Fragment key={item.path}>{link}</React.Fragment>;
                    })}</div>}
                </React.Fragment>;
            })}
            {extensions}{after}
            {admin && <a href={`/admin/servers/view/${server.internalId}`}><Icon name="controls" /><span>{vt('Administration')}</span></a>}
            <Link to="/account"><Icon name="user" /><span>{vt('Compte')}</span></Link>
        </nav>
    </aside>;
}
