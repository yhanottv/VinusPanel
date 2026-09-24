import React, { useEffect, useRef, useState } from 'react';
import { ServerContext } from '@/state/server';
import http, { httpErrorToHuman } from '@/api/http';
import PageContentBlock from '@/components/elements/PageContentBlock';
import MessageBox from '@/components/MessageBox';
import { Dialog } from '@/components/elements/dialog';
import { vt } from '@/locales/translate';
import { designPreview } from '@/designRuntime';
import Icon from '@/components/dashboard/DashboardIcon';
import PlayerSkin from './players/PlayerSkin';
import PlayerInventory, { PlayerMeter } from './players/PlayerInventory';
import { PlayerAction, PlayerResponse, requestId } from './players/types';
import styles from './players/players.module.css';

const modes: Record<string,string>={survival:'Survie',creative:'Créatif',adventure:'Aventure',spectator:'Spectateur'};
const actionLabels: Record<PlayerAction,string>={heal:'Soigner',kill:'Éliminer',feed:'Nourrir',operator:'Opérateur',whitelist:'Liste blanche',ban:'Bannissement',gamemode:'Mode de jeu',experience:'Niveau d’expérience'};
const actionErrors: Record<string,string>={offline:'Le joueur s’est déconnecté. Actualisez sa fiche.',dead:'Le joueur doit réapparaître avant de pouvoir être soigné.',disabled:'Cette action est désactivée dans la liaison joueurs.',unknown_player:'Ce joueur n’est pas connu de la liaison.',invalid_value:'La valeur demandée est invalide.',not_applied:'Le serveur n’a pas appliqué cette modification.',failed:'L’action a échoué. Consultez la console du serveur pour en savoir plus.'};

export default function ServerPlayers() {
    const server=ServerContext.useStoreState(s=>s.server.data!);
    const endpoint=`/api/client/extensions/vinuscatalog/servers/${server.uuid}/players`;
    const [data,setData]=useState<PlayerResponse|null>(null);
    const [selected,setSelected]=useState('');
    const [query,setQuery]=useState('');
    const [filter,setFilter]=useState('all');
    const [error,setError]=useState('');
    const [loadError,setLoadError]=useState('');
    const [message,setMessage]=useState('');
    const [refresh,setRefresh]=useState(0);
    const [busy,setBusy]=useState(false);
    const [ender,setEnder]=useState(false);
    const [level,setLevel]=useState('');
    const [mode,setMode]=useState('survival');
    const [textures,setTextures]=useState<Record<string,string>>({});
    const [confirmation,setConfirmation]=useState<{action:PlayerAction;value:boolean}|null>(null);
    const alive=useRef(true);const identity=useRef(server.uuid);identity.current=server.uuid;
    useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
    useEffect(()=>{setSelected('');setData(null);setError('');setMessage('');},[server.uuid]);
    useEffect(()=>{
        let active=true;let timer:ReturnType<typeof setTimeout>;
        const load=async()=>{
            if(document.hidden){timer=setTimeout(load,5000);return;}
            try { const result=await http.get<PlayerResponse>(endpoint,{params:selected?{selected}:undefined});if(active){setData(result.data);setLoadError('');} }
            catch(e){if(active)setLoadError(httpErrorToHuman(e));}
            finally{if(active)timer=setTimeout(load,5000);}
        };
        load();return()=>{active=false;clearTimeout(timer);};
    },[endpoint,selected,refresh]);
    useEffect(()=>{let active=true;fetch('/assets/images/vinus/players/items.json').then(r=>r.ok?r.json():{}).then(items=>{if(active)setTextures(items);}).catch(()=>{});return()=>{active=false;};},[]);
    const player=data?.selected?.uuid===selected?data.selected:null;
    useEffect(()=>{if(player){setLevel(String(player.level??0));setMode(player.game_mode||'survival');}},[player?.uuid]);
    const can=(action:PlayerAction)=>!!data?.can_control&&data.bridge&&data.actions.includes(action)&&!busy&&!designPreview;
    const live=(action:PlayerAction)=>can(action)&&player?.online===true;
    const act=async(action:PlayerAction,value:unknown=null,confirmed=false)=>{
        if(!selected||!can(action))return;
        const uuid=server.uuid;const name=player?.name||'';const target=selected;
        setBusy(true);setError('');setMessage('');setConfirmation(null);
        const current=()=>alive.current&&identity.current===uuid;
        try{
            const id=requestId();await http.post(`${endpoint}/actions`,{uuid:target,action,value,confirmed,request_id:id});
            for(let attempt=0;attempt<16&&current();attempt++){
                await new Promise(resolve=>setTimeout(resolve,600));if(!current())return;
                const {data:result}=await http.get<{status:string;code?:string}>(`${endpoint}/actions/${id}`);
                if(!current())return;
                if(result.status==='error')throw new Error(vt(actionErrors[result.code||'failed']||actionErrors.failed));
                if(result.status==='success'){setMessage(vt('Action appliquée à {{name}}.',{name}));setRefresh(v=>v+1);return;}
            }
            if(current())setError(vt('La commande a été envoyée, mais sa confirmation tarde. Vérifiez l’état du joueur avant de la relancer.'));
        }catch(e){if(current())setError((e as any)?.response?httpErrorToHuman(e):e instanceof Error&&!(e as any).isAxiosError?e.message:vt('La confirmation de l’action est indisponible. Vérifiez l’état du joueur avant de réessayer.'));}
        finally{if(current())setBusy(false);}
    };
    const select=(uuid:string)=>{setSelected(uuid);setEnder(false);setError('');setMessage('');setConfirmation(null);};
    const players=(data?.players||[]).filter(p=>p.name.toLowerCase().includes(query.toLowerCase())&&(filter==='all'||(filter==='online'?p.online===true:p.online===false)));
    return <PageContentBlock title={`${server.name} | ${vt('Joueurs')}`} className={styles.page}>
        <header className={styles.heading}><div>{selected&&<button className={styles.back} onClick={()=>select('')} disabled={busy}>‹ {vt('Tous les joueurs')}</button>}<h2>{vt(selected?'Fiche du joueur':'Joueurs')}</h2><p>{vt('Consultez les joueurs et gérez leurs accès au serveur.')}</p></div><button className={styles.refresh} onClick={()=>setRefresh(v=>v+1)} disabled={busy}><Icon name="history"/>{vt('Actualiser')}</button></header>
        {loadError&&<MessageBox type="error" onDismiss={()=>setLoadError('')}>{loadError}</MessageBox>}
        {error&&<MessageBox type="error" onDismiss={()=>setError('')}>{error}</MessageBox>}
        {message&&<MessageBox type="success" onDismiss={()=>setMessage('')}>{message}</MessageBox>}
        {data&&!data.bridge&&<MessageBox type="info">{vt('Les données sauvegardées sont disponibles. Le direct et les commandes nécessitent la liaison VinusPlayers sur le serveur Minecraft.')} <a href="https://github.com/yhanottv/VinusPanel/blob/codex/live-design-studio/docs/PLAYERS.md" target="_blank" rel="noreferrer">{vt('Configurer la liaison')}</a></MessageBox>}
        {!selected?<>
            <div className={styles.toolbar}><label className={styles.search}><Icon name="search"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={vt('Rechercher un joueur…')} aria-label={vt('Rechercher un joueur…')}/></label><div className={styles.tabs}>{[['all','Tous'],['online','En ligne'],['offline','Hors ligne']].map(([value,label])=><button key={value} aria-pressed={filter===value} onClick={()=>setFilter(value)}>{vt(label)}</button>)}</div></div>
            <div className={styles.roster}>{players.map(p=><button key={p.uuid} className={styles.playerCard} onClick={()=>select(p.uuid)}><PlayerSkin endpoint={endpoint} uuid={p.uuid} name={p.name} head/><span><strong>{p.name}</strong><small><i data-online={String(p.online)}/>{vt(p.online===true?'En ligne':p.online===false?'Hors ligne':'Statut en direct indisponible')}</small></span><span className={styles.badges}>{p.operator&&<span>OP</span>}{p.whitelisted&&<span>WL</span>}{p.banned&&<span>{vt('Banni')}</span>}</span><Icon name="chevron"/></button>)}</div>
            {!players.length&&<p className={styles.empty}>{vt(data?'Aucun joueur correspondant.':'Chargement des joueurs…')}</p>}
        </>:!player?<p className={styles.empty}>{vt('Chargement de la fiche…')}</p>:<>
            <section className={styles.identity}><PlayerSkin endpoint={endpoint} uuid={player.uuid} name={player.name} head/><div className={styles.playerName}><h3>{player.name}</h3><small>{player.uuid}</small></div><dl><div><dt>{vt('Mode')}</dt><dd>{vt(modes[player.game_mode||'']||'Indisponible')}</dd></div><div><dt>{vt('Dimension')}</dt><dd>{player.dimension?.replace('minecraft:','')||'—'}</dd></div><div><dt>{vt('XP total')}</dt><dd>{player.xp_total===null?'—':Math.round(player.xp_total).toLocaleString()}</dd></div></dl></section>
            <div className={styles.detailGrid}><section className={styles.playerPanel}>
                <div className={styles.vitals}><div><PlayerMeter kind="armor" value={player.armor} max={20} label="Armure"/><PlayerMeter kind="health" value={player.health} max={player.max_health||Math.max(20,player.health||20)} label="Vie"/></div><strong className={styles.level}>{player.level??'—'}<small>{vt('Niveau')}</small></strong><PlayerMeter kind="food" value={player.food} max={20} label="Nourriture"/></div>
                <progress className={styles.xp} value={player.xp_progress??0} max={1} aria-label={vt('Progression d’expérience')}/>
                <div className={styles.inventoryHeader}><div className={styles.tabs}><button aria-pressed={!ender} onClick={()=>setEnder(false)}>{vt('Inventaire')}</button><button aria-pressed={ender} onClick={()=>setEnder(true)}>{vt('Coffre de l’Ender')}</button></div><small>{vt('Consultation uniquement')}</small></div>
                <PlayerInventory player={player} endpoint={endpoint} textures={textures} ender={ender}/>
                <p className={styles.dataSource}><i data-online={String(player.source==='live')}/>{vt(player.source==='live'?'Données en direct':player.source==='snapshot'?'Dernier état connu':player.source==='save'?'Dernière sauvegarde du joueur':'Aucune sauvegarde disponible')}{player.updated_at?' · '+new Date(player.updated_at*1000).toLocaleTimeString():''}</p>
            </section><aside className={styles.controls} aria-label={vt('Contrôle du joueur')}><h3>{vt('Contrôle du joueur')}</h3>
                <label>{vt('Mode de jeu')}<select value={mode} disabled={!live('gamemode')} onChange={e=>setMode(e.target.value)}>{Object.entries(modes).map(([value,label])=><option key={value} value={value}>{vt(label)}</option>)}</select></label><button className={styles.apply} disabled={!live('gamemode')||mode===player.game_mode} onClick={()=>act('gamemode',mode)}>{vt('Appliquer le mode')}</button>
                <label>{vt('Niveau d’expérience')}<input type="number" min={0} max={10000} step={1} value={level} disabled={!live('experience')} onChange={e=>setLevel(e.target.value)}/></label><button className={styles.apply} disabled={!live('experience')||!/^\d+$/.test(level)||Number(level)>10000} onClick={()=>act('experience',Number(level))}>{vt('Appliquer le niveau')}</button>
                <div className={styles.actions}><button className={styles.heal} disabled={!live('heal')} onClick={()=>act('heal')}><span>♥</span>{vt('Soigner')}</button><button className={styles.kill} disabled={!live('kill')} onClick={()=>setConfirmation({action:'kill',value:true})}><Icon name="close"/>{vt('Éliminer')}</button><button className={styles.feed} disabled={!live('feed')} onClick={()=>act('feed')}><Icon name="plus"/>{vt('Nourrir')}</button></div>
                <div className={styles.toggles}>{([['operator','Opérateur',player.operator],['whitelist','Liste blanche',player.whitelisted],['ban','Banni',player.banned]] as const).map(([action,label,value])=><label key={action}><span>{vt(label)}</span><button type="button" role="switch" aria-label={vt(label)} aria-checked={value} disabled={!can(action)} onClick={()=>action==='whitelist'?act(action,!value):setConfirmation({action,value:!value})}><span/></button></label>)}</div>
                <p className={styles.controlHint}>{vt(designPreview?'Les actions sont désactivées dans l’aperçu.':!data?.can_control?'La permission console est nécessaire pour gérer les joueurs.':!data?.bridge?'Liaison joueurs inactive.':player.online!==true?'Soins, nourriture, mode de jeu et XP nécessitent un joueur connecté.':'Les commandes sont appliquées directement au joueur sélectionné.')}</p>
                {busy&&<p role="status">{vt('Confirmation du serveur en cours…')}</p>}
            </aside></div>
        </>}
        <Dialog open={!!confirmation} title={vt(confirmation?actionLabels[confirmation.action]:'Confirmer')} onClose={()=>setConfirmation(null)}>
            <div className={styles.confirm}><p>{confirmation?.action==='kill'?vt('Éliminer {{name}} ? Le joueur peut perdre ses objets et son expérience selon les règles du serveur.',{name:player?.name||''}):confirmation?.action==='operator'?vt(confirmation.value?'Donner les droits opérateur à {{name}} ? Ces droits permettent d’administrer le serveur Minecraft.':'Retirer les droits opérateur de {{name}} ?',{name:player?.name||''}):vt(confirmation?.value?'Bannir {{name}} ? Le joueur sera déconnecté et ne pourra plus rejoindre ce serveur.':'Retirer le bannissement de {{name}} ?',{name:player?.name||''})}</p><div><button onClick={()=>setConfirmation(null)}>{vt('Annuler')}</button><button className={styles.danger} onClick={()=>confirmation&&act(confirmation.action,confirmation.action==='kill'?null:confirmation.value,true)}>{vt('Confirmer')}</button></div></div>
        </Dialog>
    </PageContentBlock>;
}
