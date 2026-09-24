import React, { useEffect, useState, useRef } from 'react';
import http, { httpErrorToHuman } from '@/api/http';
import MessageBox from '@/components/MessageBox';
import { vt } from '@/locales/translate';
import { designPreview } from '@/designRuntime';
import styles from './players.module.css';

type Availability = { supported:boolean; can_install:boolean; software:string|null; minecraft:string|null; kind:string|null; reason:string|null; read_only:boolean };
export default function PlayerCompanion({endpoint,onInstalled}:{endpoint:string;onInstalled:()=>void}) {
    const alive=useRef(true);
    useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
    const [data,setData]=useState<Availability|null>(null);
    const [busy,setBusy]=useState(false);
    const [error,setError]=useState('');
    const [message,setMessage]=useState('');
    useEffect(()=>{let alive=true;http.get(`${endpoint}/companion`).then(r=>{if(alive)setData(r.data);}).catch(e=>{if(alive)setError(httpErrorToHuman(e));});return()=>{alive=false;};},[endpoint]);
    const install=async()=>{
        setBusy(true);setError('');
        try{const result=await http.post(`${endpoint}/companion`);if(alive.current){setMessage(vt(result.data.status==='existing'?'Une liaison existe déjà. Démarrez le serveur ou vérifiez sa compatibilité dans la console.':'Liaison installée. Démarrez le serveur pour activer les données en direct.'));onInstalled();}}
        catch(e){if(alive.current)setError(httpErrorToHuman(e));}finally{if(alive.current)setBusy(false);}
    };
    return <section className={styles.companion}>
        <div><strong>{vt('Liaison joueurs')}</strong><p>{vt('Les données sauvegardées restent consultables. Installez la liaison compatible pour afficher les joueurs et leurs inventaires en direct.')}</p>
            {data&&<small>{data.software||vt('Logiciel inconnu')} · {data.minecraft||vt('Version Minecraft inconnue')} · {vt(data.supported?(data.kind==='plugin'?'Plugin compatible':'Mod compatible'):'Aucune liaison vérifiée pour cette configuration')}</small>}
            {data?.reason==='loader'&&<p>{vt('La version du loader est inconnue ou n’a pas encore été vérifiée. Consultez la liste de compatibilité.')}</p>}
            {data?.reason==='java'&&<p>{vt('L’image Java de ce serveur est inconnue ou trop ancienne pour cette liaison.')}</p>}
            {data?.supported&&<p>{vt('Le serveur doit être arrêté. Aucun fichier existant n’est remplacé. Démarrez-le après l’installation.')}{data.read_only?' '+vt('Cette liaison de mod permet la consultation uniquement.'):''}</p>}
        </div>
        {data?.supported&&data.can_install&&<button className={styles.refresh} disabled={busy||designPreview||!!message} onClick={install}>{vt(busy?'Installation…':'Installer la liaison')}</button>}
        {error&&<MessageBox type="error" onDismiss={()=>setError('')}>{error}</MessageBox>}
        {message&&<MessageBox type="success">{message}</MessageBox>}
        <a href="https://github.com/yhanottv/VinusPanel/blob/codex/live-design-studio/docs/PLAYERS.md" target="_blank" rel="noreferrer">{vt('Compatibilité et installation')}</a>
    </section>;
}
