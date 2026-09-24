import React, { useEffect, useRef, useState } from 'react';
import { VinusDesignSettings } from '@/vinusDesign';
import styles from './style.module.css';
export default function LivePreview({design,path,device,light}:{design:VinusDesignSettings;path:string;device:number;light:boolean}) {
    const frame=useRef<HTMLIFrameElement>(null), host=useRef<HTMLDivElement>(null);
    const [size,setSize]=useState({width:900,height:720});
    useEffect(() => { if(!host.current) return; const observer=new ResizeObserver(([entry]) => setSize({width:entry.contentRect.width,height:entry.contentRect.height})); observer.observe(host.current); return () => observer.disconnect(); },[]);
    const send=() => frame.current?.contentWindow?.postMessage({type:'vinus:studio-draft',design,light},window.location.origin);
    useEffect(() => { send(); },[design,light,path]);
    useEffect(() => { const ready=(event:MessageEvent) => { if(event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === 'vinus:studio-ready') send(); }; window.addEventListener('message',ready); return () => window.removeEventListener('message',ready); },[design,light]);
    useEffect(()=>{const pick=()=>frame.current?.contentWindow?.postMessage({type:'vinus:studio-pick'},window.location.origin);window.addEventListener('vinus:pick-start',pick);return()=>window.removeEventListener('vinus:pick-start',pick);},[]);
    useEffect(()=>{const replay=()=>frame.current?.contentWindow?.postMessage({type:'vinus:studio-replay'},window.location.origin);window.addEventListener('vinus:preview-replay',replay);return()=>window.removeEventListener('vinus:preview-replay',replay);},[]);
    const scale=Math.min(1,Math.max(0.1,(size.width-24)/device));
    const height=Math.max(640,(size.height-24)/scale);
    return <div className={styles.previewCanvas} ref={host}><div className={styles.deviceFrame} style={{width:device*scale,height:height*scale}}><iframe ref={frame} title="Aperçu du panel en direct" src={`${path}?vinus-preview=1&lang=${design.options.default_language}`} onLoad={send} style={{width:device,height,transform:`scale(${scale})`}} /></div></div>;
}
