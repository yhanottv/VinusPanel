import useServerOperation from './useServerOperation';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import http, { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faExternalLinkAlt, faExclamationTriangle, faCubes, faSearch } from '@fortawesome/free-solid-svg-icons';
import { vt } from '@/locales/translate';
import form from './software.module.css';
import styles from './modpacks.module.css';

interface Pack { id: string; title: string; description: string; author: string; downloads: number; icon: string | null; page_url: string; }
interface Release { id: string; name: string; version: string; games: string[]; channel: string; loaders: string[]; published: string; }
interface Plan { token: string; title: string; release: string; minecraft: string; software: string; loader: string | null; java: number; size: number; files: number; optional: string[]; skipped: number; }

export default function ServerModpacks() {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const status = ServerContext.useStoreState(s => s.status.value);
    const refreshServer = ServerContext.useStoreActions(a => a.server.getServer);
    const operation = useServerOperation(server.uuid);
    const permitted = usePermissions(['startup.read','startup.update','settings.reinstall','file.read','file.read-content','file.create','file.update','file.delete']).every(Boolean);
    const endpoint = `/api/client/extensions/vinuscatalog/servers/${server.uuid}/modpacks`;
    const [source,setSource]=useState('modrinth'); const [curseforge,setCurseforge]=useState(false);
    const [query, setQuery] = useState(''); const [search, setSearch] = useState(''); const [sort, setSort] = useState('downloads');
    const [offset, setOffset] = useState(0); const [total, setTotal] = useState(0); const [packs, setPacks] = useState<Pack[]>([]);
    const [selected, setSelected] = useState<Pack | null>(null); const [versions, setVersions] = useState<Release[]>([]); const [version, setVersion] = useState('');
    const [plan, setPlan] = useState<Plan | null>(null); const [optional, setOptional] = useState<string[]>([]); const [replace, setReplace] = useState(false);
    const [loading, setLoading] = useState(true); const [versionLoading, setVersionLoading] = useState(false); const [busy, setBusy] = useState(false);
    const [error, setError] = useState(''); const [modalError, setModalError] = useState(''); const [result, setResult] = useState<{message: string; backup: string} | null>(null);
    useEffect(() => {
        const timer = window.setTimeout(() => { setSearch(query); setOffset(0); }, 350);
        return () => window.clearTimeout(timer);
    }, [query]);
    useEffect(() => {
        let active = true; setLoading(true); setError('');
        http.get(`${endpoint}/search`, { params: { source, query: search, offset, sort } }).then(({data}) => { if (active) { setPacks(data.hits); setTotal(data.total); setCurseforge(!!data.sources?.curseforge); } })
            .catch(e => { if (active) setError(httpErrorToHuman(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [endpoint, source, search, offset, sort]);
    useEffect(() => {
        let active = true; setPlan(null); setVersions([]); setVersion(''); setModalError(''); setReplace(false); setOptional([]); setVersionLoading(false);
        if (!selected) return;
        setVersionLoading(true);
        http.get(`${endpoint}/versions`, { params: { source, project: selected.id } }).then(({data}) => { if (active) { setVersions(data.versions); setVersion(data.versions.find((v: Release) => v.channel === 'release')?.id || data.versions[0]?.id || ''); } })
            .catch(e => { if (active) setModalError(httpErrorToHuman(e)); }).finally(() => { if (active) setVersionLoading(false); });
        return () => { active = false; };
    }, [endpoint, source, selected?.id]);
    const prepare = async () => {
        if (!selected || busy) return; setBusy(true); setModalError('');
        try { const {data} = await http.post(`${endpoint}/plan`, { source, project: selected.id, version }, { timeout: 240000 }); setPlan(data); setOptional([]); setReplace(false); }
        catch (e) { setModalError(httpErrorToHuman(e)); } finally { setBusy(false); }
    };
    const install = async () => {
        if (!plan || busy || !replace) return; setBusy(true); setModalError(''); setResult(null);
        try {
            const {data} = await http.post(`${endpoint}/install`, { token: plan.token, optional, replace }, { timeout: 660000 });
            if (operation.current()) { setResult(data); setSelected(null); setPlan(null); await refreshServer(server.id); }
        } catch (e) { if (operation.current()) { setModalError(httpErrorToHuman(e)); setPlan(null); } } finally { operation.reconnect(); if (operation.current()) setBusy(false); }
    };
    return <PageContentBlock title={`${server.name} | Modpacks`} className={form.page}>
        <header className={form.heading}><div><h2>Modpacks</h2><p>{vt('Installez un pack complet avec sa version de Minecraft et son mod loader.')}</p></div></header>
        <div className={`${form.warning} ${styles.warning}`}><FontAwesomeIcon icon={faExclamationTriangle}/><div><strong>{vt('Un modpack remplace le serveur')}</strong><p>{vt('Le logiciel, les mondes, les mods, les plugins et les configurations actuels seront déplacés dans un dossier de récupération. Le pack sera installé à leur place. Créez une sauvegarde de ce que vous souhaitez conserver.')}</p></div></div>
        <div className={styles.toolbar}><div className={styles.sources} aria-label={vt('Sources des modpacks')}><button type="button" aria-pressed={source==='modrinth'} onClick={()=>{setSource('modrinth');setOffset(0);setSelected(null);}}>Modrinth</button><button type="button" aria-pressed={source==='curseforge'} disabled={!curseforge} title={!curseforge?vt('Clé API CurseForge non configurée'):undefined} onClick={()=>{setSource('curseforge');setOffset(0);setSelected(null);}}>CurseForge</button></div><label className={styles.search}><FontAwesomeIcon icon={faSearch}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder={vt('Rechercher un modpack…')} aria-label={vt('Rechercher un modpack…')}/></label><select aria-label={vt('Trier les modpacks')} value={sort} onChange={e => { setSort(e.target.value); setOffset(0); }}><option value="downloads">{vt('Popularité')}</option><option value="relevance">{vt('Pertinence')}</option><option value="updated">{vt('Mise à jour')}</option></select></div>
        {!curseforge&&<p className={styles.sourceNote}>{vt('CurseForge indisponible : clé API non configurée.')}</p>}{source==='curseforge'&&<p className={styles.sourceNote}>{vt('Seules les publications accompagnées d’un pack serveur fourni par l’auteur sont proposées.')}</p>}
        {error && <p role="alert" className={form.error}>{error}</p>}
        {result && <div role="status" className={form.success}>{result.message}<Link to={`/server/${server.id}/files#/${result.backup}`}>{vt('Ouvrir les fichiers de récupération')} ↗</Link></div>}
        {loading ? <p role="status">{vt('Chargement des modpacks…')}</p> : <div className={styles.list}>{packs.map(pack => <article key={pack.id} className={styles.row}>
            {pack.icon ? <img src={pack.icon} alt="" loading="lazy" referrerPolicy="no-referrer"/> : <span className={styles.fallback}><FontAwesomeIcon icon={faCubes}/></span>}
            <div className={styles.info}><h3>{pack.title}</h3><p>{pack.description}</p><small>{new Intl.NumberFormat(undefined, {notation:'compact'}).format(pack.downloads)} {vt('installations')} · {pack.author}</small></div>
            <a href={pack.page_url} target="_blank" rel="noreferrer" aria-label={`${vt('Page du projet')} ${pack.title}`}><FontAwesomeIcon icon={faExternalLinkAlt}/></a>
            <button type="button" className={form.primary} onClick={() => setSelected(pack)}><FontAwesomeIcon icon={faDownload}/> {vt('Installer')}</button>
        </article>)}{!packs.length && <p>{vt('Aucun modpack trouvé.')}</p>}</div>}
        <div className={styles.pagination}><button type="button" disabled={loading || offset === 0} onClick={() => setOffset(Math.max(0, offset - 12))}>{vt('Précédent')}</button><span>{Math.min(offset + 1, total)}–{Math.min(offset + 12,total)} / {total}</span><button type="button" disabled={loading || offset + 12 >= total} onClick={() => setOffset(offset + 12)}>{vt('Suivant')}</button></div>
        <Dialog open={!!selected} title={selected?.title || 'Modpack'} onClose={() => { if (!busy) setSelected(null); }}><div className={form.modal}>
            {modalError && <p role="alert" className={form.error}>{modalError}</p>}
            <label>{vt('Version du modpack')}<select disabled={busy || versionLoading || !!plan} value={version} onChange={e => setVersion(e.target.value)}>{versions.map(v => <option key={v.id} value={v.id}>{v.name} · {v.games.join(', ')} · {v.loaders.join(', ')} · {new Date(v.published).toLocaleDateString()}{v.channel !== 'release' ? ` · ${v.channel}` : ''}</option>)}</select></label>
            {versionLoading && <p role="status">{vt('Chargement des versions…')}</p>}
            {!versionLoading&&!versions.length&&<p>{vt('Aucune publication compatible avec une installation serveur automatique.')}</p>}
            {!permitted && <p>{vt('Les permissions de réinstallation, de démarrage et de gestion des fichiers sont nécessaires.')}</p>}
            {plan ? <><p>Minecraft {plan.minecraft} · {plan.software} {plan.loader} · Java {plan.java}</p><p>{plan.files} {vt('fichiers requis')} · {(plan.size / 1048576).toFixed(1)} Mio · {plan.skipped} {vt('fichiers client exclus')}</p>
                {!!plan.optional.length && <details className={styles.optional}><summary>{plan.optional.length} {vt('fichiers optionnels')}</summary>{plan.optional.map(path => <label key={path}><input type="checkbox" disabled={busy} checked={optional.includes(path)} onChange={e => setOptional(current => e.target.checked ? [...current,path] : current.filter(p => p !== path))}/><span>{path}</span></label>)}</details>}
                <div className={form.warning}>{vt('Cette installation remplace les fichiers actifs du serveur et son monde. Les anciens fichiers sont conservés dans un dossier de récupération. Le serveur reste arrêté après l’installation.')}</div>
                <label className={styles.confirm}><input type="checkbox" disabled={busy} checked={replace} onChange={e => setReplace(e.target.checked)}/><span>{vt('Je confirme le remplacement de ce serveur par ce modpack.')}</span></label>
                {status !== 'offline' && <p>{vt('Arrêtez le serveur depuis la console pour continuer.')}</p>}
                <button type="button" className={form.primary} disabled={busy || !replace || status !== 'offline'} onClick={install}>{busy ? vt('Téléchargement, vérification et installation…') : vt('Remplacer le serveur et installer')}</button>
                {busy && <p role="status">{vt('L’opération peut prendre plusieurs minutes. Gardez cette fenêtre ouverte jusqu’au résultat.')}</p>}
            </> : <button type="button" className={form.primary} disabled={busy || versionLoading || !version || !permitted} onClick={prepare}>{busy ? vt('Analyse du modpack…') : vt('Préparer l’installation')}</button>}
        </div></Dialog>
    </PageContentBlock>;
}
