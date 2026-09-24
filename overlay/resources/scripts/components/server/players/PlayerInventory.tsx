import React from 'react';
import { vt } from '@/locales/translate';
import { PlayerDetail, PlayerItem } from './types';
import PlayerSkin from './PlayerSkin';
import styles from './players.module.css';

function Slot({ item, label, textures }: { item?: PlayerItem; label: string; textures: Record<string,string> }) {
    const name=item?(item.name||textures[item.id]||item.id):vt('Emplacement vide');
    const title=`${label} · ${name}${item?` × ${item.count}${item.enchanted?' · '+vt('Enchanté'):''}`:''}`;
    return <div className={styles.slot} data-enchanted={!!item?.enchanted} tabIndex={item?0:undefined} role="img" aria-label={title} title={title}>
        {item&&<>{textures[item.id]?<svg viewBox="0 0 16 16" aria-hidden="true"><use href={`/assets/images/vinus/players/items.svg#${item.id.slice(10)}`}/></svg>:<span className={styles.unknownItem} aria-hidden="true">◇</span>}
            {item.count>1&&<span className={styles.count}>{item.count}</span>}
            <span className={styles.itemTooltip}>{name}<small>{item.id}</small>{item.damage>0&&<small>{vt('Usure : {{damage}}',{damage:item.damage})}</small>}</span>
        </>}
    </div>;
}

export default function PlayerInventory({ player, endpoint, textures, ender }: { player: PlayerDetail; endpoint: string; textures: Record<string,string>; ender: boolean }) {
    const items=ender?player.ender_chest:player.inventory;
    const find=(slot:number)=>items.find(item=>item.slot===slot);
    const slots=Array.from({length:27},(_,i)=>ender?i:i+9);
    return <div className={styles.inventoryBoard}>
        <div className={styles.character}>
            {!ender&&<div className={styles.equipment}>{[[103,'Casque'],[102,'Plastron'],[101,'Jambières'],[100,'Bottes'],[-106,'Main secondaire']].map(([slot,label])=><Slot key={slot} item={find(Number(slot))} label={vt(String(label))} textures={textures}/>)}</div>}
            <PlayerSkin endpoint={endpoint} uuid={player.uuid} name={player.name}/>
        </div>
        <div className={styles.inventorySlots}>
            <div className={styles.slotGrid} aria-label={vt(ender?'Coffre de l’Ender':'Inventaire')}>{slots.map(slot=><Slot key={slot} item={find(slot)} textures={textures} label={vt('Emplacement {{slot}}',{slot:slot+1})}/>)}</div>
            {!ender&&<div className={`${styles.slotGrid} ${styles.hotbar}`} aria-label={vt('Barre d’accès rapide')}>{Array.from({length:9},(_,slot)=><Slot key={slot} item={find(slot)} textures={textures} label={vt('Accès rapide {{slot}}',{slot:slot+1})}/>)}</div>}
        </div>
    </div>;
}

export function PlayerMeter({ value, max, kind, label }: { value: number | null; max: number; kind:'health'|'food'|'armor'; label:string }) {
    const safe=value===null?null:Math.max(0,Math.min(max,value));
    const path=kind==='health'?'M2 2h4v2h2V2h4v2h2v6h-2v2h-2v2H6v-2H4v-2H2z':kind==='armor'?'M2 2h12v8l-6 5-6-5z':'M8 1h5v2h2v5h-2v2H9l-4 4H2v-3l4-4V3z';
    return <div className={`${styles.meter} ${styles[kind]}`} role="meter" aria-label={vt(label)} aria-valuemin={0} aria-valuemax={max} aria-valuenow={safe??undefined} aria-valuetext={safe===null?vt('Indisponible'):String(value)}>
        <div className={styles.meterIcons}>{Array.from({length:10},(_,index)=><span key={index}><svg viewBox="0 0 16 16" aria-hidden="true"><path d={path}/></svg><span style={{width:`${safe===null?0:Math.max(0,Math.min(1,safe/max*10-index))*100}%`}}><svg viewBox="0 0 16 16" aria-hidden="true"><path d={path}/></svg></span></span>)}</div>
        <small>{vt(label)} <strong>{value===null?'—':Math.round(value*10)/10}{value!==null&&kind!=='health'?` / ${max}`:''}</strong></small>
    </div>;
}
