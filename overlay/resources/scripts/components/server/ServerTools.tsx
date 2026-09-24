import MessageBox from '@/components/MessageBox';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Can from '@/components/elements/Can';
import loadDirectory, { FileObject } from '@/api/server/files/loadDirectory';
import getFileContents from '@/api/server/files/getFileContents';
import { httpErrorToHuman } from '@/api/http';
import { bytesToString } from '@/lib/formatters';
import { vt } from '@/locales/translate';
import { VINUS } from '@/theme';
import SoftwareIcon, { softwareName } from './SoftwareIcon';
import VinusCatalogEntry from './VinusCatalogEntry';
import styles from './server.module.css';

export default function ServerTools() {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const { pathname } = useLocation();
    const tool = pathname.split('/').pop()!;
    const titles: Record<string, string> = { plugins: 'Plugins', mods: 'Mods', worlds: 'Mondes', players: 'Joueurs', version: 'Version', support: 'Assistance' };
    const title = vt(titles[tool] || 'Serveur');
    const base = `/server/${server.id}`;
    const [files, setFiles] = useState<FileObject[]>([]);
    const [players, setPlayers] = useState<{ name: string; uuid: string }[]>([]);
    const [query, setQuery] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [refresh, setRefresh] = useState(0);
    const [tab, setTab] = useState<'installed' | 'catalog'>('catalog');
    useEffect(() => { setQuery(''); setTab('catalog'); }, [tool, server.uuid]);
    useEffect(() => {
        let active = true;
        setError(''); setFiles([]); setPlayers([]);
        if (!['plugins', 'mods', 'worlds', 'players'].includes(tool) || (['plugins', 'mods'].includes(tool) && tab === 'catalog')) { setLoading(false); return; }
        setLoading(true);
        const load = async () => {
            if (tool === 'players') {
                const content = await getFileContents(server.uuid, '/usercache.json');
                const data: unknown = JSON.parse(content);
                if (!Array.isArray(data)) throw new Error(vt('Format de liste de joueurs non reconnu.'));
                if (active) setPlayers(data.filter(p => typeof p?.name === 'string' && typeof p?.uuid === 'string'));
            } else {
                const root = await loadDirectory(server.uuid, '/');
                if (tool === 'worlds') {
                    const candidates = root.filter(f => !f.isFile && !f.isSymlink && !['mods','plugins','libraries','logs','config','cache','crash-reports','.cache'].includes(f.name));
                    const worlds: FileObject[] = [];
                    // Limit concurrency, not results, on servers with many folders.
                    for (let i = 0; i < candidates.length && active; i += 4) {
                        const batch = await Promise.all(candidates.slice(i, i + 4).map(async f => {
                            const contents = await loadDirectory(server.uuid, `/${f.name}`);
                            return contents.some(x => x.name === 'level.dat' || (!x.isFile && ['region','DIM-1','DIM1'].includes(x.name))) ? f : null;
                        }));
                        worlds.push(...batch.filter((x): x is FileObject => x !== null));
                    }
                    if (active) setFiles(worlds);
                } else if (root.some(f => f.name === tool && !f.isFile)) {
                    const contents = await loadDirectory(server.uuid, `/${tool}`);
                    if (active) setFiles(contents.filter(f => f.isFile && /\.jar(?:\.disabled)?$/i.test(f.name)));
                }
            }
        };
        load().catch(e => { if (active) setError(httpErrorToHuman(e)); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [tool, server.uuid, refresh, tab]);
    const catalog = tool === 'mods' || tool === 'plugins';
    return <PageContentBlock title={`${server.name} | ${title}`} className={styles.page}>
        <div className={styles.toolHeading}><div><h2>{title}</h2><p>{catalog ? vt('Extensions installées et catalogue compatible avec votre serveur.') : tool === 'worlds' ? vt('Mondes présents dans les fichiers du serveur.') : tool === 'players' ? vt('Joueurs connus du serveur, lus depuis usercache.json.') : ''}</p></div>
            {['plugins','mods','worlds','players'].includes(tool) && <button className={styles.action} type="button" disabled={loading} onClick={() => setRefresh(v => v + 1)}>{vt('Actualiser')}</button>}
        </div>
        {catalog && <div className={styles.toolbar} role="group" aria-label={vt('Vue du catalogue')}><button type="button" className={styles.action} aria-pressed={tab === 'catalog'} onClick={() => setTab('catalog')}>{vt('Découvrir')}</button><button type="button" className={styles.action} aria-pressed={tab === 'installed'} onClick={() => setTab('installed')}>{vt('Installés')}</button></div>}
        {catalog && tab === 'catalog' ? <VinusCatalogEntry key={`${server.uuid}:${tool}:${refresh}`} kind={tool as 'mods' | 'plugins'} /> : <>
            {error && <MessageBox type="error" dismissible key={error}>{error}<p>{tool === 'players' ? vt('La liste devient disponible après les premières connexions sur un serveur Minecraft compatible.') : vt('Vérifiez les permissions et la disponibilité des fichiers du serveur.')}</p></MessageBox>}
            {loading && <p role="status" className={styles.note}>{vt('Chargement…')}</p>}
            {(catalog || tool === 'worlds') && !loading && !error && <>
                <div className={styles.toolbar}><Can action="file.read"><Link className={styles.action} to={`${base}/files#/${catalog ? tool : ''}`}>{vt('Ouvrir les fichiers')}</Link></Can><Can action="backup.read"><Link className={styles.action} to={`${base}/backups`}>{vt('Sauvegardes')}</Link></Can></div>
                <input className={styles.input} placeholder={vt('Rechercher…')} aria-label={vt('Rechercher…')} value={query} onChange={e => setQuery(e.target.value)} />
                <div className={styles.list} style={{ marginTop: 16 }}>{files.filter(f => f.name.toLowerCase().includes(query.toLowerCase())).map(file => <Link key={file.name} to={`${base}/files#/${tool === 'worlds' ? encodeURIComponent(file.name) : tool}`}><span>{file.name}</span><small>{tool === 'worlds' ? vt('Ouvrir le monde') : `${bytesToString(file.size)} · ${file.name.endsWith('.disabled') ? vt('Désactivé') : vt('Installé')}`}</small></Link>)}</div>
                {!files.length && <p className={styles.empty}>{tool === 'worlds' ? vt('Aucun monde détecté dans les dossiers du serveur.') : vt('Aucune extension installée dans ce dossier.')}</p>}
                <p className={styles.note}>{catalog ? vt('Les changements de fichiers prennent effet au prochain redémarrage. Le gestionnaire de fichiers permet d’importer, renommer et supprimer vos fichiers.') : vt('Créez une sauvegarde avant de remplacer un monde. Le gestionnaire de fichiers permet d’importer et d’extraire une archive.')}</p>
            </>}
            {tool === 'players' && <>
                <div className={styles.toolbar}>{[['whitelist.json','Liste blanche'],['ops.json','Opérateurs'],['banned-players.json','Joueurs bannis']].map(([file,label]) => <Can action="file.read-content" key={file}><Link className={styles.action} to={`${base}/files/edit#/${file}`}>{vt(label)}</Link></Can>)}</div>
                <input className={styles.input} value={query} onChange={e => setQuery(e.target.value)} placeholder={vt('Rechercher un joueur…')} aria-label={vt('Rechercher un joueur…')} />
                <div className={styles.list} style={{ marginTop: 16 }}>{players.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map(p => <div className={styles.listRow} key={p.uuid}><strong>{p.name}</strong><span>{p.uuid}</span></div>)}</div>
                {!loading && !error && !players.length && <p className={styles.empty}>{vt('Aucun joueur connu.')}</p>}
                <p className={styles.note}>{vt('Cette liste ne représente pas les joueurs actuellement connectés. Gérez les accès dans les fichiers dédiés et les commandes dans la console.')}</p>
            </>}
            {tool === 'version' && <section className={styles.panel}><h2><SoftwareIcon software={server.softwareProfile?.software} /> {softwareName(server.softwareProfile?.software)}</h2><dl className={styles.details}>
                <div><dt>{vt('Version Minecraft')}</dt><dd>{server.softwareProfile?.game_version || vt('Non déclarée')}</dd></div>
                <div><dt>{vt('Image Docker')}</dt><dd>{server.dockerImage}</dd></div>
                {server.variables.filter(v => /VERSION|BUILD|JAR|LOADER|SOFTWARE|SERVER_TYPE/.test(v.envVariable)).map(v => <div key={v.envVariable}><dt>{v.name}</dt><dd>{v.serverValue || v.defaultValue || '—'}</dd></div>)}
            </dl><p className={styles.note} style={{ padding: 20 }}>{vt('Les variables de démarrage déterminent le logiciel et sa version. Modifier une variable ne réinstalle pas automatiquement le serveur.')}</p><div className={styles.toolbar} style={{ padding: '0 20px 20px' }}><Link className={styles.action} to={`${base}/startup`}>{vt('Variables de démarrage')}</Link><Can action="settings.reinstall"><Link className={styles.action} to={`${base}/settings`}>{vt('Options de réinstallation')}</Link></Can></div></section>}
            {tool === 'support' && <section className={styles.empty}><h2>{vt('Besoin d’aide ?')}</h2><p className={styles.note}>{vt('Retrouvez la communauté et la documentation du panel.')}</p><div className={styles.toolbar}>{VINUS.discordInvite && <a className={styles.action} href={VINUS.discordInvite} target="_blank" rel="noreferrer">Discord ↗</a>}<a className={styles.action} href="https://github.com/yhanottv/VinusPanel#support" target="_blank" rel="noreferrer">{vt('Documentation')} ↗</a></div></section>}
        </>}
    </PageContentBlock>;
}
