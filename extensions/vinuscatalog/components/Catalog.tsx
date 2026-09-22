import React, { useEffect, useRef, useState } from 'react';
import http, { httpErrorToHuman } from '@/api/http';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { usePermissions } from '@/plugins/usePermissions';
import { Dialog } from '@/components/elements/dialog';
import styles from './catalog.module.css';

type Kind = 'mods' | 'plugins';
interface Profile { software: string | null; categories: Partial<Record<Kind, string[]>>; game_version: string | null; }
interface Project { icon_url?: string | null; project_id: string; title: string; description?: string; author?: string; downloads?: number; date_modified?: string; kind?: Kind; version?: string; }
interface Plan { token: string; files: { title: string; version: string; filename: string; size: number; action: string }[]; }

const ProjectIcon = ({ project }: { project: Project }) => {
    const [failed, setFailed] = useState(false);
    const url = project.icon_url;
    const allowed = !!url && /^https:\/\/cdn\.modrinth\.com\/(data|cached_images)\/[a-zA-Z0-9/_-]+\.(png|jpe?g|webp|gif)$/.test(url);
    useEffect(() => setFailed(false), [url]);
    return <div className={styles.project_icon}>{allowed && !failed
        ? <img src={url!} alt={''} loading={'lazy'} decoding={'async'} referrerPolicy={'no-referrer'} onError={() => setFailed(true)} />
        : <span aria-hidden={'true'}>{project.title.slice(0, 2).toUpperCase()}</span>}</div>;
};

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const permissions = usePermissions(['file.create', 'file.update', 'file.read-content']);
    const canInstall = permissions.every(Boolean);
    const endpoint = `/api/client/extensions/vinuscatalog/servers/${uuid}`;
    const [profile, setProfile] = useState<Profile | null>(null);
    const [versions, setVersions] = useState<string[]>([]);
    const [version, setVersion] = useState('');
    const [kind, setKind] = useState<Kind>('mods');
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState('relevance');
    const [offset, setOffset] = useState(0);
    const [hits, setHits] = useState<Project[]>([]);
    const [installed, setInstalled] = useState<Project[]>([]);
    const [total, setTotal] = useState(0);
    const [view, setView] = useState<'catalog' | 'installed'>('catalog');
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [plan, setPlan] = useState<Plan | null>(null);
    const requestId = useRef(0);
    const selection = useRef('');
    selection.current = `${uuid}:${kind}:${version}`;

    useEffect(() => {
        let active = true;
        setProfile(null); setError(''); setVersion(''); setLoading(true);
        http.get(`${endpoint}/profile`).then(({ data }) => {
            if (!active) return;
            setProfile(data.profile); setVersions(data.versions); setInstalled(data.installed);
            setKind(Object.keys(data.profile.categories)[0] as Kind || 'mods');
            setVersion(data.profile.game_version || '');
        }).catch((err) => active && setError('Catalogue — ' + httpErrorToHuman(err))).finally(() => active && setLoading(false));
        return () => { active = false; requestId.current++; };
    }, [endpoint]);

    useEffect(() => {
        const id = ++requestId.current;
        if (!profile?.categories[kind] || !version || view !== 'catalog') { setHits([]); return; }
        setLoading(true); setError('');
        const timer = setTimeout(() => {
            http.get(`${endpoint}/search`, { params: { kind, game_version: version, query, offset, sort } }).then(({ data }) => {
                if (id === requestId.current) { setHits(data.hits); setTotal(data.total); }
            }).catch((err) => { if (id === requestId.current) { setError('Catalogue — ' + httpErrorToHuman(err)); setHits([]); } })
                .finally(() => { if (id === requestId.current) setLoading(false); });
        }, 300);
        return () => { clearTimeout(timer); requestId.current++; };
    }, [endpoint, profile, kind, version, query, offset, sort, view]);

    const prepare = (project: Project) => {
        const requestedSelection = selection.current;
        setBusy(project.project_id); setError(''); setMessage('');
        http.post(`${endpoint}/plan`, { kind, game_version: version, project_id: project.project_id })
            .then(({ data }) => { if (selection.current === requestedSelection) setPlan(data); })
            .catch((err) => { if (selection.current === requestedSelection) setError('Catalogue — ' + httpErrorToHuman(err)); }).finally(() => setBusy(''));
    };
    const install = () => {
        if (!plan || busy) return;
        setBusy('install'); setError('');
        http.post(`${endpoint}/install`, { token: plan.token }, { timeout: 300000 })
            .then(({ data }) => { setInstalled(data.installed); setMessage(data.message); setPlan(null); })
            .catch((err) => { setError('Catalogue — ' + httpErrorToHuman(err)); setPlan(null); }).finally(() => setBusy(''));
    };
    const categories = profile ? Object.keys(profile.categories) as Kind[] : [];
    const displayed = view === 'installed' ? installed.filter((item) => item.kind === kind) : hits;
    const stopped = connected && status === 'offline';

    return <PageContentBlock title={'Catalogue Minecraft'} className={styles.page}>
        <div className={styles.heading}>
            <div><p className={styles.eyebrow}>CATALOGUE MINECRAFT</p><h1>{categories.length === 1 ? kind === 'mods' ? 'Mods' : 'Plugins' : 'Mods et plugins'}</h1>
                <p>Des extensions choisies pour votre serveur. Catalogue Modrinth.</p></div>
            {profile?.software && <span className={styles.software}>{profile.software} {version && `· ${version}`}</span>}
        </div>
        {error && <div role={'alert'} className={styles.error}><strong>La demande n’a pas abouti</strong><p>{error}</p></div>}
        {message && <p role={'status'} className={styles.success}>{message}</p>}
        {!profile && loading && <p role={'status'}>Identification du serveur…</p>}
        {profile && categories.length === 0 && <div className={styles.empty}>
            <h2>{profile.software === 'vanilla' ? 'Ce serveur Vanilla ne charge pas de mods ou plugins.' : 'Logiciel du serveur non identifié.'}</h2>
            <p>{profile.software === 'vanilla' ? 'Le logiciel du serveur doit être adapté avant de pouvoir ajouter des extensions.' : 'Demandez à un administrateur d’associer un profil compatible à cet egg dans la configuration du catalogue.'}</p>
        </div>}
        {categories.length > 0 && <>
            <div className={styles.filters}>
                {categories.length > 1 && <div className={styles.tabs} role={'group'} aria-label={'Type d’extension'}>{categories.map((item) => <button key={item} type={'button'} aria-pressed={kind === item} onClick={() => { setKind(item); setOffset(0); setPlan(null); }}>{item === 'mods' ? 'Mods' : 'Plugins'}</button>)}</div>}
                <label>Version Minecraft<select value={version} disabled={!!profile?.game_version} onChange={(e) => { setVersion(e.target.value); setOffset(0); setPlan(null); }}><option value={''}>Choisir la version du serveur</option>{versions.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
                <div className={styles.tabs} role={'group'} aria-label={'Vue du catalogue'}><button type={'button'} aria-pressed={view === 'catalog'} onClick={() => setView('catalog')}>Découvrir</button><button type={'button'} aria-pressed={view === 'installed'} onClick={() => setView('installed')}>Installés avec ce catalogue</button></div>
            </div>
            {!version ? <p className={styles.empty}>La version Minecraft n’est pas déclarée dans cet egg. Sélectionnez celle qui est réellement installée.</p> : <>
                {view === 'catalog' && <div className={styles.search}>
                    <input aria-label={kind === 'mods' ? 'Rechercher un mod' : 'Rechercher un plugin'} placeholder={kind === 'mods' ? 'Rechercher un mod…' : 'Rechercher un plugin…'} value={query} onChange={(e) => { setQuery(e.target.value); setOffset(0); }} />
                    <select aria-label={'Trier les résultats'} value={sort} onChange={(e) => { setSort(e.target.value); setOffset(0); }}><option value={'relevance'}>Pertinence</option><option value={'downloads'}>Popularité</option><option value={'updated'}>Mis à jour récemment</option></select>
                </div>}
                <p className={styles.note}>{profile?.categories[kind]?.join(', ')} · Versions stables compatibles. {categories.length > 1 && 'Les logiciels hybrides peuvent imposer des contraintes supplémentaires.'}</p>
                {loading && view === 'catalog' ? <p role={'status'} className={styles.empty}>Recherche dans le catalogue…</p> : <div className={styles.results}>
                    {displayed.map((project) => <article key={project.project_id} className={styles.result}>
                        <div className={styles.project_heading}><ProjectIcon project={project} /><h2>{project.title}</h2><a href={`https://modrinth.com/project/${project.project_id}`} target={'_blank'} rel={'noopener noreferrer'}>Fiche ↗</a></div>
                        {project.author && <p className={styles.author}>par {project.author}</p>}
                        <p className={styles.description}>{project.description || `Version installée : ${project.version}`}</p>
                        <div className={styles.bottom}><span>{project.downloads !== undefined ? `${new Intl.NumberFormat('fr', { notation: 'compact' }).format(project.downloads)} téléchargements` : 'Installation suivie'}</span>
                            {canInstall && <button type={'button'} disabled={!!busy} onClick={() => prepare(project)}>{busy === project.project_id ? 'Préparation…' : view === 'installed' ? 'Vérifier la mise à jour' : 'Voir les fichiers'}</button>}</div>
                    </article>)}
                    {!displayed.length && <p className={styles.empty}>{view === 'installed' ? 'Aucune installation suivie dans cette catégorie.' : 'Aucun résultat pour ces critères.'}</p>}
                </div>}
                {view === 'catalog' && <div className={styles.pagination}><button type={'button'} disabled={loading || offset === 0} onClick={() => setOffset(Math.max(0, offset - 12))}>Précédent</button><span>{total ? `${offset + 1}–${Math.min(offset + 12, total)} sur ${total}` : '0 résultat'}</span><button type={'button'} disabled={loading || offset + 12 >= total} onClick={() => setOffset(offset + 12)}>Suivant</button></div>}
            </>}
        </>}
        <Dialog open={!!plan} onClose={() => { if (!busy) setPlan(null); }} title={'Fichiers à installer'}>
            {plan && <div className={styles.plan}>
                <p>Les dépendances requises sont incluses. Destination : /{kind}.</p>
                <ul>{plan.files.map((file) => <li key={file.filename}><strong>{file.title}</strong><span>{file.version} · {(file.size / 1024 / 1024).toFixed(1)} Mio</span><code>{file.filename}</code><small>{file.action === 'update' ? 'Mise à jour · ancien fichier conservé' : file.action === 'verify' ? 'Vérification de la version installée' : 'Nouvelle installation'}</small></li>)}</ul>
                {!stopped && <p>Arrêtez le serveur depuis la console avant de confirmer l’installation.</p>}
                <button type={'button'} disabled={!stopped || !!busy} onClick={install}>{busy === 'install' ? 'Téléchargement et vérification…' : 'Confirmer l’installation'}</button>
            </div>}
        </Dialog>
    </PageContentBlock>;
};
