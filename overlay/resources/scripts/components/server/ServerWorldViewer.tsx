import MessageBox from '@/components/MessageBox';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import http, { httpErrorToHuman } from '@/api/http';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGlobe, faCube, faSyncAlt, faDownload } from '@fortawesome/free-solid-svg-icons';
import { vt } from '@/locales/translate';
import form from './software.module.css';
import styles from './viewer.module.css';
import useServerOperation from './useServerOperation';

interface Profile { supported: boolean; configured: boolean; ready: boolean; can_authorize: boolean; config: string | null; minecraft: string | null; }
interface Plan { token: string; files: {title: string; version: string; filename: string; size: number; reuse?: boolean}[]; }
export default function ServerWorldViewer() {
    const server=ServerContext.useStoreState(s=>s.server.data!);
    const status=ServerContext.useStoreState(s=>s.status.value);
    const operation=useServerOperation(server.uuid);
    const canInstall=usePermissions(['file.read','file.read-content','file.create','file.update','file.delete']).every(Boolean);
    const endpoint=`/api/client/extensions/vinuscatalog/servers/${server.uuid}/bluemap`;
    const [profile,setProfile]=useState<Profile | null>(null),[refresh,setRefresh]=useState(0);
    const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
    const [open,setOpen]=useState(false),[plan,setPlan]=useState<Plan | null>(null),[accept,setAccept]=useState(false);
    const [resourceMode,setResourceMode]=useState(false);
    const [viewer,setViewer]=useState('');
    useEffect(()=>{
        let active=true;setLoading(true);setError('');
        http.get(`${endpoint}/profile`).then(({data})=>{if(active)setProfile(data);}).catch(e=>{if(active)setError(httpErrorToHuman(e));}).finally(()=>{if(active)setLoading(false);});
        return()=>{active=false;};
    },[endpoint,refresh]);
    useEffect(()=>{
        if(!profile?.ready){setViewer('');return;}
        let active=true, token='';
        const renew=async()=>{
            try {
                const {data}=await http.post(`${endpoint}/session`,token?{token}:{});
                if(!active){void http.delete(`${endpoint}/session`,{data:{token:data.token}}).catch(()=>undefined);return;}
                token=data.token;setViewer(data.url);
            }catch(e){if(active){setViewer('');setError(httpErrorToHuman(e));}}
        };
        void renew();const timer=window.setInterval(renew,300000);
        return()=>{active=false;window.clearInterval(timer);if(token)void http.delete(`${endpoint}/session`,{data:{token}}).catch(()=>undefined);};
    },[endpoint,profile?.ready,refresh]);
    const prepare=async()=>{
        if(busy)return;setBusy(true);setError('');setAccept(false);setResourceMode(false);
        try{const {data}=await http.post(`${endpoint}/plan`,{}, {timeout:90000});if(operation.current()){setPlan(data);setOpen(true);}}
        catch(e){if(operation.current())setError(httpErrorToHuman(e));}finally{if(operation.current())setBusy(false);}
    };
    const install=async()=>{
        if((!plan&&!resourceMode)||busy||(resourceMode&&!accept))return;setBusy(true);setError('');
        try{
            const {data}=await http.post(`${endpoint}/${resourceMode?'resources':'install'}`,resourceMode?{accept_resources:accept}:{token:plan!.token,accept_resources:accept},{timeout:330000});
            if(operation.current()){setMessage(data.message);setOpen(false);setPlan(null);setRefresh(v=>v+1);}
        }catch(e){if(operation.current()){setError(httpErrorToHuman(e));setOpen(false);setPlan(null);}}
        finally{
            operation.reconnect();
            if(operation.current())setBusy(false);
        }
    };
    return <PageContentBlock title={`${server.name} | World Viewer`} className={form.page}>
        <header className={form.heading}><div><h2>World Viewer</h2><p>{vt('Explorez votre monde Minecraft en 3D avec BlueMap.')}</p></div><button className={styles.refresh} type="button" onClick={()=>setRefresh(v=>v+1)} disabled={loading||busy}><FontAwesomeIcon icon={faSyncAlt}/> {vt('Actualiser')}</button></header>
        {error&&<MessageBox type="error" dismissible key={error}>{error}</MessageBox>}{message&&<p role="status" className={form.success}>{message}</p>}
        {viewer?<><div className={styles.bar}><span><i/> BlueMap · Minecraft {profile?.minecraft}</span><span>{vt('Vue privée du serveur')}</span></div><iframe title={vt('Carte 3D du monde')} className={styles.frame} src={viewer} sandbox="allow-scripts allow-pointer-lock" referrerPolicy="no-referrer"/><p className={styles.note}>{vt('Les rendus continuent lorsque le serveur est en ligne. Les cartes déjà générées restent consultables à l’arrêt.')}</p></>:<section className={styles.empty}>
            <div className={styles.globe}><FontAwesomeIcon icon={faGlobe}/><span><FontAwesomeIcon icon={faCube}/></span></div>
            <h3>{loading?vt('Chargement…'):profile?.can_authorize?vt('Autorisation Minecraft requise'):profile?.configured?vt('BlueMap est installé'):vt('Découvrez votre monde en 3D')}</h3>
            <p>{profile?.can_authorize?vt('BlueMap est prêt. Le rendu attend votre autorisation de télécharger les ressources de Minecraft Java.'):profile?.configured?vt('Démarrez le serveur et laissez BlueMap générer ses premières cartes, puis actualisez cette page. Le téléchargement des ressources Minecraft doit être autorisé dans core.conf.'):vt('Installez BlueMap pour explorer les constructions, les paysages et les dimensions de votre serveur directement depuis le panel.')}</p>
            {profile?.can_authorize&&<button type="button" className={form.primary} disabled={!canInstall||busy||status!=='offline'} onClick={()=>{setResourceMode(true);setAccept(false);setOpen(true);}}>{vt('Autoriser les ressources')}</button>}
            {!loading&&profile&&!profile.supported&&<p className={form.warning}>{vt('BlueMap nécessite Paper, Spigot, Fabric, Forge ou un autre logiciel compatible. Choisissez votre logiciel dans Version.')}</p>}
            {profile?.supported&&!profile.configured&&<button className={form.primary} type="button" disabled={!canInstall||busy||status!=='offline'} onClick={prepare}><FontAwesomeIcon icon={faDownload}/> {busy?vt('Préparation…'):vt('Installer BlueMap')}</button>}
            {profile?.supported&&!profile.configured&&status!=='offline'&&<small>{vt('Arrêtez le serveur pour installer BlueMap.')}</small>}
            {profile?.config&&profile.configured&&<Link to={`/server/${server.id}/files#/${profile.config}`}>{vt('Ouvrir la configuration')} ↗</Link>}
            <a href="https://bluemap.bluecolored.de/wiki/" target="_blank" rel="noreferrer">{vt('Documentation BlueMap')} ↗</a>
        </section>}
        <Dialog open={open} title={vt(resourceMode?'Autoriser les ressources':'Installer BlueMap')} onClose={()=>{if(!busy)setOpen(false);}}><div className={form.modal}>
            <p>{vt(resourceMode?'Cette autorisation permet à BlueMap de générer la carte au prochain démarrage.':'Version adaptée au logiciel et à Minecraft. Les mondes et les réglages du serveur sont conservés.')}</p>
            {!resourceMode&&<ul className={styles.files}>{plan?.files.map(file=><li key={file.filename}><strong>{file.title} · {file.version}</strong><small>{file.filename}{file.reuse?` · ${vt('Déjà installé, conservé')}`:''}</small></li>)}</ul>}
            <label className={styles.accept}><input type="checkbox" checked={accept} disabled={busy} onChange={e=>setAccept(e.target.checked)}/><span>{vt('J’accepte l’EULA Mojang, je possède une licence Minecraft Java et j’autorise BlueMap à télécharger les ressources du client Minecraft.')} <a href="https://bluemap.bluecolored.de/wiki/configs/Core.html#accept-download" target="_blank" rel="noreferrer">{vt('Lire les conditions')} ↗</a></span></label>
            {!accept&&!resourceMode&&<p className={styles.note}>{vt('Sans cette autorisation, BlueMap sera installé mais ne pourra pas générer la carte.')}</p>}
            <button className={form.primary} type="button" onClick={install} disabled={busy||status!=='offline'||(resourceMode&&!accept)}>{busy?vt('Application…'):vt(resourceMode?'Autoriser les ressources':'Installer BlueMap')}</button>
        </div></Dialog>
    </PageContentBlock>;
}
