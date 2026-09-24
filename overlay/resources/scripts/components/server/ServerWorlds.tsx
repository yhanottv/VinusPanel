import MessageBox from '@/components/MessageBox';
import useServerOperation from './useServerOperation';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import http, { httpErrorToHuman } from '@/api/http';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload, faGlobe, faSearch } from '@fortawesome/free-solid-svg-icons';
import { vt } from '@/locales/translate';
import form from './software.module.css';
import styles from './worlds.module.css';

interface World { project_id: string; title: string; description: string; author: string; downloads: number; icon_url: string | null; page_url: string; }
interface Profile { available: boolean; game_version: string | null; active: string | null; archives: {path: string; name: string; size: number}[]; }
interface Release { id: string; name: string; game_versions: string[]; }
interface Plan { token: string; name: string; minecraft: string | null; size: number; files: number; previous: string; }

export default function ServerWorlds() {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const status = ServerContext.useStoreState(s => s.status.value);
    const operation = useServerOperation(server.uuid);
    const canInstall = usePermissions(['file.read','file.read-content','file.create','file.update','file.delete']).every(Boolean);
    const endpoint = `/api/client/extensions/vinuscatalog/servers/${server.uuid}/worlds`;
    const input = useRef<HTMLInputElement>(null);
    const [profile,setProfile] = useState<Profile | null>(null); const [refresh,setRefresh] = useState(0);
    const [query,setQuery] = useState(''); const [search,setSearch] = useState(''); const [category,setCategory] = useState(''); const [sort,setSort] = useState('downloads');
    const [categories,setCategories] = useState<{id:number;name:string}[]>([]); const [hits,setHits] = useState<World[]>([]); const [offset,setOffset] = useState(0); const [total,setTotal] = useState(0);
    const [loading,setLoading] = useState(true); const [busy,setBusy] = useState(false); const [uploading,setUploading] = useState<number | null>(null); const [error,setError] = useState(''); const [modalError,setModalError] = useState('');
    const [selected,setSelected] = useState<World | 'upload' | null>(null); const [path,setPath] = useState(''); const [versions,setVersions] = useState<Release[]>([]); const [version,setVersion] = useState('');
    const [versionLoading,setVersionLoading] = useState(false); const [plan,setPlan] = useState<Plan | null>(null); const [activate,setActivate] = useState(false); const [result,setResult] = useState<{message:string;backup:string} | null>(null);
    useEffect(() => { const timer=window.setTimeout(()=>{setSearch(query);setOffset(0);},350);return()=>window.clearTimeout(timer); },[query]);
    useEffect(() => {
        let active=true;setError('');setLoading(true);
        http.get(`${endpoint}/profile`).then(({data})=>{if(active)setProfile(data);}).catch(e=>{if(active)setError(httpErrorToHuman(e));}).finally(()=>{if(active)setLoading(false);});
        return()=>{active=false;};
    },[endpoint,refresh]);
    useEffect(() => {
        if(!profile?.available)return;let active=true;
        http.get(`${endpoint}/categories`).then(({data})=>{if(active)setCategories(data.categories);}).catch(e=>{if(active)setError(httpErrorToHuman(e));});
        return()=>{active=false;};
    },[endpoint,profile?.available]);
    useEffect(() => {
        if(!profile?.available)return;let active=true;setLoading(true);setError('');
        http.get(`${endpoint}/search`,{params:{query:search,offset,sort,category:category||undefined}}).then(({data})=>{if(active){setHits(data.hits);setTotal(data.total);}}).catch(e=>{if(active)setError(httpErrorToHuman(e));}).finally(()=>{if(active)setLoading(false);});
        return()=>{active=false;};
    },[endpoint,profile?.available,search,offset,sort,category]);
    useEffect(() => {
        let active=true;setVersions([]);setVersion('');setPlan(null);setActivate(false);setModalError('');setVersionLoading(false);
        if(!selected || selected==='upload')return;setVersionLoading(true);
        http.get(`${endpoint}/versions`,{params:{project:selected.project_id}}).then(({data})=>{if(active){setVersions(data.versions);setVersion(data.versions[0]?.id||'');}}).catch(e=>{if(active)setModalError(httpErrorToHuman(e));}).finally(()=>{if(active)setVersionLoading(false);});
        return()=>{active=false;};
    },[endpoint,selected]);
    const upload = async (file: File) => {
        if(uploading!==null || !canInstall)return;
        if(!/\.zip$/i.test(file.name) || !file.size || file.size>512*1048576){setError(vt('Choisissez une archive ZIP de 512 Mio maximum.'));return;}
        setUploading(0);setError('');
        try {
            const name=`map-upload-${crypto.randomUUID()}.zip`; const data=new FormData();data.append('files',file,name);
            const url=await getFileUploadUrl(server.uuid);
            await axios.post(url,data,{params:{directory:'/'},onUploadProgress:p=>setUploading(Math.min(100,Math.round(p.loaded/file.size*100)))});
            setPath('/'+name);setSelected('upload');setRefresh(v=>v+1);
        }catch(e){setError(httpErrorToHuman(e));}finally{setUploading(null);if(input.current)input.current.value='';}
    };
    const prepare = async () => {
        if(!selected || busy)return;setBusy(true);setModalError('');
        try {
            const body=selected==='upload'?{source:'uploaded',path}:{source:'curseforge',project:selected.project_id,version};
            const {data}=await http.post(`${endpoint}/plan`,body,{timeout:240000});setPlan(data);setActivate(false);
        }catch(e){setModalError(httpErrorToHuman(e));}finally{setBusy(false);}
    };
    const install = async () => {
        if(!plan || busy || !activate)return;setBusy(true);setModalError('');setResult(null);
        try {
            const {data}=await http.post(`${endpoint}/install`,{token:plan.token,activate},{timeout:660000});
            if(operation.current()){setResult(data);setSelected(null);setPlan(null);setRefresh(v=>v+1);}
        }catch(e){if(operation.current()){setModalError(httpErrorToHuman(e));setPlan(null);}}finally{
            operation.reconnect();if(operation.current())setBusy(false);
        }
    };
    return <PageContentBlock title={`${server.name} | ${vt('Mondes')}`} className={form.page}>
        <header className={form.heading}><div><h2>{vt('Mondes')}</h2><p>{vt('Installez une carte et choisissez le monde actif de votre serveur.')}</p></div><button type="button" className={form.primary} disabled={!canInstall||uploading!==null} onClick={()=>input.current?.click()}><FontAwesomeIcon icon={faUpload}/> {uploading===null?vt('Importer une carte ZIP'):`${vt('Envoi…')} ${uploading}%`}</button></header>
        <input ref={input} type="file" accept=".zip,application/zip" hidden aria-label={vt('Archive du monde')} onChange={e=>{const file=e.target.files?.[0];if(file)upload(file);}}/>
        {profile?.active && <div className={styles.current}><FontAwesomeIcon icon={faGlobe}/><span><strong>{vt('Monde actif')}</strong><span>{profile.active} · Minecraft {profile.game_version||'—'}</span></span><Link to={`/server/${server.id}/files#/${encodeURIComponent(profile.active)}`}>{vt('Ouvrir les fichiers')} ↗</Link></div>}
        {!!profile?.archives.length && <div className={styles.archive}><label>{vt('Archive déjà sur le serveur')}<select value={path} onChange={e=>setPath(e.target.value)}><option value="">{vt('Choisir une archive ZIP')}</option>{profile.archives.map(a=><option key={a.path} value={a.path} disabled={a.size>512*1048576}>{a.name} · {(a.size/1048576).toFixed(1)} Mio</option>)}</select></label><button type="button" className={form.primary} disabled={!path||!canInstall} onClick={()=>setSelected('upload')}>{vt('Installer cette carte')}</button></div>}
        {error && <MessageBox type="error" dismissible key={error}>{error}</MessageBox>}{result && <div role="status" className={form.success}>{result.message}<Link to={`/server/${server.id}/files#/${result.backup}`}>{vt('Ouvrir les fichiers de récupération')} ↗</Link></div>}
        <div className={styles.toolbar}><label><FontAwesomeIcon icon={faSearch}/><input value={query} disabled={!profile?.available} onChange={e=>setQuery(e.target.value)} placeholder={vt('Rechercher une carte, skyblock, aventure…')} aria-label={vt('Rechercher une carte')}/></label><select disabled={!profile?.available} aria-label={vt('Catégorie des cartes')} value={category} onChange={e=>{setCategory(e.target.value);setOffset(0);}}><option value="">{vt('Toutes les catégories')}</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><select disabled={!profile?.available} aria-label={vt('Trier les cartes')} value={sort} onChange={e=>{setSort(e.target.value);setOffset(0);}}><option value="downloads">{vt('Popularité')}</option><option value="updated">{vt('Mise à jour')}</option></select></div>
        {profile && !profile.available && <div className={styles.unavailable}><FontAwesomeIcon icon={faGlobe}/><h3>{vt('Catalogue CurseForge indisponible')}</h3><p>{vt('La clé API CurseForge n’est pas configurée. Vous pouvez déjà importer une carte ZIP ou installer une archive présente sur le serveur.')}</p></div>}
        {loading && <p role="status">{vt('Chargement…')}</p>}
        <div className={styles.grid}>{hits.map(world=><article className={styles.card} key={world.project_id}>{world.icon_url && <img src={world.icon_url} alt="" loading="lazy" referrerPolicy="no-referrer"/>}<h3>{world.title}</h3><small>{world.author} · {new Intl.NumberFormat().format(world.downloads)} {vt('téléchargements')}</small><p>{world.description}</p><footer><a href={world.page_url} target="_blank" rel="noreferrer">{vt('Page du projet')} ↗</a><button type="button" onClick={()=>setSelected(world)}><FontAwesomeIcon icon={faDownload}/> {vt('Installer')}</button></footer></article>)}</div>
        {profile?.available && !loading && !hits.length && <p>{vt('Aucune carte trouvée.')}</p>}
        {profile?.available && <div className={styles.pagination}><button type="button" disabled={loading||offset===0} onClick={()=>setOffset(Math.max(0,offset-12))}>{vt('Précédent')}</button><span>{Math.min(offset+1,total)}–{Math.min(offset+12,total)} / {total}</span><button type="button" disabled={loading||offset+12>=total} onClick={()=>setOffset(offset+12)}>{vt('Suivant')}</button></div>}
        <Dialog open={!!selected} title={selected && selected!=='upload'?selected.title:vt('Installer une carte')} onClose={()=>{if(!busy)setSelected(null);}}><div className={form.modal}>
            {modalError && <MessageBox type="error" dismissible key={modalError}>{modalError}</MessageBox>}
            {selected==='upload'?<p className={styles.filename}>{path.split('/').pop()}</p>:<label>{vt('Version de la carte')}<select disabled={busy||!!plan||versionLoading} value={version} onChange={e=>setVersion(e.target.value)}>{versions.map(v=><option key={v.id} value={v.id}>{v.name} · {v.game_versions.join(', ')}</option>)}</select></label>}
            {plan?<><h3>{plan.name}</h3><p>Minecraft {plan.minecraft||vt('Version non déclarée')} · {(plan.size/1048576).toFixed(1)} Mio · {plan.files} {vt('fichiers')}</p><div className={form.warning}>{vt('Cette carte deviendra le monde actif. Le monde précédent et les propriétés actuelles seront conservés. Le serveur reste arrêté après l’installation.')}</div><label className={styles.confirm}><input type="checkbox" checked={activate} disabled={busy} onChange={e=>setActivate(e.target.checked)}/><span>{vt('Activer cette carte à la place du monde actuel.')}</span></label>{status!=='offline'&&<p>{vt('Arrêtez le serveur depuis la console pour continuer.')}</p>}<button type="button" className={form.primary} disabled={busy||!activate||status!=='offline'} onClick={install}>{busy?vt('Installation du monde…'):vt('Installer et activer')}</button></>:<button type="button" className={form.primary} disabled={busy||versionLoading||!canInstall||(selected==='upload'?!path:!version)} onClick={prepare}>{busy?vt('Vérification de la carte…'):vt('Préparer l’installation')}</button>}
        </div></Dialog>
    </PageContentBlock>;
}
