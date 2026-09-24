import MessageBox from '@/components/MessageBox';
import useServerOperation from './useServerOperation';
import React, { useEffect, useRef, useState } from 'react';
import { ServerContext } from '@/state/server';
import http, { httpErrorToHuman } from '@/api/http';
import { usePermissions } from '@/plugins/usePermissions';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { Dialog } from '@/components/elements/dialog';
import { Link } from 'react-router-dom';
import SoftwareIcon, { softwareName } from './SoftwareIcon';
import { vt } from '@/locales/translate';
import styles from './software.module.css';

interface Software { name: string; icon: string | null; description: string; deprecated: boolean; experimental: boolean; }
interface Version { id: string; java: number; channel: string; supported: boolean; }
interface Build { id: number; name: string; experimental: boolean; }
interface Plan { token: string; java: number; image: string; label: string; size: number; }
const groupNames: Record<string, string> = { recommended: 'Recommandés', established: 'Établis', experimental: 'Expérimentaux', miscellaneous: 'Autres logiciels', limbos: 'Serveurs d’attente' };

export default function ServerSoftware() {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const status = ServerContext.useStoreState(s => s.status.value);
    const refreshServer = ServerContext.useStoreActions(a => a.server.getServer);
    const operation = useServerOperation(server.uuid);
    const canInstall = usePermissions(['startup.update','settings.reinstall','file.read','file.read-content','file.create','file.update','file.delete']).every(Boolean);
    const endpoint = `/api/client/extensions/vinuscatalog/servers/${server.uuid}/software`;
    const [groups, setGroups] = useState<Record<string, Record<string, Software>>>({});
    const [selected, setSelected] = useState('');
    const [versions, setVersions] = useState<Version[]>([]);
    const [version, setVersion] = useState('');
    const [builds, setBuilds] = useState<Build[]>([]);
    const [build, setBuild] = useState('');
    const [query, setQuery] = useState('');
    const [plan, setPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [backup, setBackup] = useState('');
    const identity = useRef(''); identity.current = `${server.uuid}:${selected}:${version}:${build}`;
    const software = Object.values(groups).reduce<Record<string, Software>>((all, group) => ({ ...all, ...group }), {});
    useEffect(() => {
        let active = true; setLoading(true); setError(''); setSelected(''); setPlan(null);
        http.get(`${endpoint}/types`).then(({ data }) => { if (active) setGroups(data.groups); })
            .catch(e => { if (active) setError(httpErrorToHuman(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [endpoint]);
    useEffect(() => {
        let active = true; setVersions([]); setVersion(''); setBuilds([]); setBuild(''); setPlan(null);
        if (!selected) return;
        setLoading(true); setError('');
        http.get(`${endpoint}/versions`, { params: { type: selected } }).then(({ data }) => {
            if (active) { setVersions(data.versions); setVersion(data.versions.find((v: Version) => v.id === server.softwareProfile?.game_version)?.id || data.versions[0]?.id || ''); }
        }).catch(e => { if (active) setError(httpErrorToHuman(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [endpoint, selected]);
    useEffect(() => {
        let active = true; setBuilds([]); setBuild(''); setPlan(null);
        if (!selected || !version) return;
        setLoading(true); setError('');
        http.get(`${endpoint}/builds`, { params: { type: selected, version } }).then(({ data }) => {
            if (active) { setBuilds(data.builds); setBuild(String(data.builds[0]?.id || '')); }
        }).catch(e => { if (active) setError(httpErrorToHuman(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [endpoint, selected, version]);
    const prepare = async () => {
        const request = identity.current; setBusy(true); setError('');
        try { const { data } = await http.post(`${endpoint}/plan`, { type: selected, version, build: Number(build) }); if (request === identity.current) setPlan(data); }
        catch (e) { if (request === identity.current) setError(httpErrorToHuman(e)); } finally { setBusy(false); }
    };
    const install = async () => {
        if (!plan || busy) return;
        setBusy(true); setError(''); setMessage('');
        try {
            const { data } = await http.post(`${endpoint}/install`, { token: plan.token }, { timeout: 660000 });
            if (operation.current()) { setMessage(data.message); setBackup(data.backup); setPlan(null); setSelected(''); await refreshServer(server.id); }
        } catch (e) { if (operation.current()) { setError(httpErrorToHuman(e)); setPlan(null); } } finally { operation.reconnect(); if (operation.current()) setBusy(false); }
    };
    return <PageContentBlock title={`${server.name} | Version`} className={styles.page}>
        <header className={styles.heading}><div><h2>{vt('Version du serveur')}</h2><p>{vt('Choisissez votre logiciel, sa version et le build à installer.')}</p></div><span className={styles.current}><SoftwareIcon software={server.softwareProfile?.software} size={24} />{softwareName(server.softwareProfile?.software)} · {server.softwareProfile?.game_version || '—'}</span></header>
        <div className={styles.warning}>{vt('Un changement de logiciel peut rendre vos mondes, plugins ou mods incompatibles. Les fichiers remplacés sont conservés dans un dossier de récupération. Créez aussi une sauvegarde de vos mondes avant de changer de version.')}</div>
        {error && !selected && <MessageBox type="error" dismissible key={error}>{error}</MessageBox>}
        {message && <div className={styles.success} role="status">{message}{backup && <Link to={`/server/${server.id}/files#/${backup}`}>{vt('Ouvrir les fichiers de récupération')} ↗</Link>}</div>}
        <input className={styles.search} value={query} onChange={e => setQuery(e.target.value)} placeholder={vt('Rechercher un logiciel…')} aria-label={vt('Rechercher un logiciel…')} />
        {loading && !selected && <p role="status">{vt('Chargement des logiciels…')}</p>}
        {Object.entries(groups).map(([group, items]) => {
            const visible = Object.entries(items).filter(([, item]) => item.name.toLowerCase().includes(query.toLowerCase()));
            return visible.length ? <section className={styles.group} key={group}><h3>{vt(groupNames[group] || group)}</h3><div className={styles.grid}>{visible.map(([id, item]) => <button className={styles.card} type="button" key={id} onClick={() => { setSelected(id); setError(''); }}>
                {item.icon ? <img src={item.icon} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <SoftwareIcon software={id.toLowerCase()} />}
                <span><strong>{item.name}{item.deprecated && <small>EOL</small>}{item.experimental && <small>{vt('Expérimental')}</small>}</strong><span>{item.description}</span></span><b aria-hidden="true">›</b>
            </button>)}</div></section> : null;
        })}
        {!!Object.keys(groups).length && !Object.values(software).some(item => item.name.toLowerCase().includes(query.toLowerCase())) && <p>{vt('Aucun logiciel ne correspond à cette recherche.')}</p>}
        <Dialog open={!!selected} title={software[selected]?.name || vt('Version')} onClose={() => { if (!busy) { setSelected(''); setPlan(null); setError(''); } }}>
            <div className={styles.modal}>
                {error && <MessageBox type="error" dismissible key={error}>{error}</MessageBox>}
                <label>{vt('Version')}<select disabled={loading || busy || !!plan} value={version} onChange={e => setVersion(e.target.value)}>{versions.map(v => <option key={v.id} value={v.id}>{v.id} · Java {v.java}{v.channel !== 'RELEASE' ? ` · ${v.channel}` : ''}</option>)}</select></label>
                <label>{vt('Build')}<select disabled={loading || busy || !!plan} value={build} onChange={e => { setBuild(e.target.value); setPlan(null); }}>{builds.map(b => <option key={b.id} value={b.id}>{b.name}{b.experimental ? ` · ${vt('Expérimental')}` : ''}</option>)}</select></label>
                {loading && <p role="status">{vt('Chargement des versions…')}</p>}
                {!canInstall && <p>{vt('Les permissions de réinstallation, de démarrage et de gestion des fichiers sont nécessaires.')}</p>}
                {plan ? <><div className={styles.warning}>{vt('Confirmer ce changement remplacera le logiciel et ses bibliothèques. Vos mondes et extensions restent présents. Le serveur doit être arrêté et restera arrêté après l’installation.')}</div><p>{plan.label} · Java {plan.java} · {(plan.size / 1048576).toFixed(1)} Mio</p><label className={styles.imageLabel}>{vt('Image Docker')}<code>{plan.image}</code></label>{status !== 'offline' && <p>{vt('Arrêtez le serveur depuis la console pour continuer.')}</p>}
                    <button className={styles.primary} type="button" disabled={busy || status !== 'offline'} onClick={install}>{busy ? vt('Téléchargement, vérification et installation…') : vt('Confirmer l’installation')}</button>
                </> : <button className={styles.primary} type="button" disabled={!canInstall || busy || loading || !build} onClick={prepare}>{busy ? vt('Préparation…') : vt('Préparer l’installation')}</button>}
            </div>
        </Dialog>
    </PageContentBlock>;
}
