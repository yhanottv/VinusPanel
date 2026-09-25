import React, { useEffect, useRef, useState } from 'react';
import { vt } from '@/locales/translate';
import styles from './players.module.css';

export default function PlayerSkin({ endpoint, uuid, name, head = false }: { endpoint: string; uuid: string; name: string; head?: boolean }) {
    const canvas=useRef<HTMLCanvasElement>(null);
    const [loaded,setLoaded]=useState(false);
    useEffect(()=>{
        let active=true;setLoaded(false);const image=new Image();
        image.onload=()=>{
            if(!active)return;const ctx=canvas.current?.getContext('2d');if(!ctx)return;
            ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,24,36);
            const part=(sx:number,sy:number,w:number,h:number,x:number,y:number)=>ctx.drawImage(image,sx,sy,w,h,x,y,w,h);
            if(head){part(8,8,8,8,0,0);part(40,8,8,8,0,0);}
            else {
                part(8,8,8,8,8,2);part(20,20,8,12,8,10);part(44,20,4,12,4,10);part(4,20,4,12,8,22);
                part(image.height===64?36:44,image.height===64?52:20,4,12,16,10);part(image.height===64?20:4,image.height===64?52:20,4,12,12,22);
                part(40,8,8,8,8,2);
                if(image.height===64){part(20,36,8,12,8,10);part(44,36,4,12,4,10);part(52,52,4,12,16,10);part(4,36,4,12,8,22);part(4,52,4,12,12,22);}
            }setLoaded(true);
        };
        image.src=`${endpoint}/${uuid}/skin`;return()=>{active=false;image.onload=null;};
    },[endpoint,uuid,head]);
    return <span className={head?styles.avatar:styles.skin}>
        <canvas ref={canvas} width={head?8:24} height={head?8:36} role="img" aria-label={loaded?vt('Skin de {{name}}',{name}):vt('Skin indisponible')} style={{visibility:loaded?'visible':'hidden'}}/>
        {!loaded&&<svg viewBox="0 0 24 36" fill="currentColor" aria-hidden="true"><path d="M8 2h8v8H8z M5 11h14v12h-3v11h-4V23h-1v11H7V23H5z"/></svg>}
    </span>;
}
