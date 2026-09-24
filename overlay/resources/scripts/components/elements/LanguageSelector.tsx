import React, { useEffect, useRef, useState } from 'react';
import { changeLanguage, panelLanguage } from '@/locales/preferences';
import { languages, PanelLanguage } from '@/locales/languages';
import { vt } from '@/locales/translate';
import styles from './language-selector.module.css';

// Inline artwork renders consistently on phones and Windows without a flag CDN.
export function LanguageFlag({ code }: { code: PanelLanguage }) {
    return <svg className={styles.flag} viewBox="0 0 30 20" aria-hidden="true" focusable="false">
        {code === 'en' ? <><path fill="#193678" d="M0 0h30v20H0z"/><path stroke="#fff" strokeWidth="4" d="m0 0 30 20M30 0 0 20"/><path stroke="#c8102e" strokeWidth="1.5" d="m0 0 30 20M30 0 0 20"/><path stroke="#fff" strokeWidth="7" d="M15 0v20M0 10h30"/><path stroke="#c8102e" strokeWidth="4" d="M15 0v20M0 10h30"/></>
        : code === 'tr' ? <><path fill="#e30a17" d="M0 0h30v20H0z"/><circle fill="#fff" cx="12" cy="10" r="6"/><circle fill="#e30a17" cx="13.5" cy="10" r="4.8"/><path fill="#fff" d="m20 6 1 2.8h3l-2.4 1.8.9 2.8-2.5-1.7-2.4 1.7.9-2.8-2.4-1.8h3z"/></>
        : code === 'pt' ? <><path fill="#d71920" d="M0 0h30v20H0z"/><path fill="#006600" d="M0 0h12v20H0z"/><circle fill="#ffcf40" cx="12" cy="10" r="4.8"/><path fill="#fff" stroke="#d71920" strokeWidth="1.2" d="M9.5 6.8h5v4c0 2.4-2.5 3.2-2.5 3.2s-2.5-.8-2.5-3.2z"/><path fill="#164194" d="M11 8h2v3h-2z"/></>
        : code === 'es' ? <><path fill="#aa151b" d="M0 0h30v20H0z"/><path fill="#f1bf00" d="M0 5h30v10H0z"/><path fill="#aa151b" d="M8 8h4v4l-2 1-2-1z"/><path fill="#fff" d="M9 9h2v2H9z"/></>
        : code === 'de' || code === 'nl' ? <>{(code === 'de' ? ['#171717','#d00','#ffce00'] : ['#ae1c28','#fff','#21468b']).map((fill,index)=><rect key={fill} fill={fill} x="0" y={index*20/3} width="30" height={20/3}/>)}</>
        : <>{(code === 'it' ? ['#009246','#fff','#ce2b37'] : ['#163c93','#fff','#ed2939']).map((fill,index)=><rect key={fill} fill={fill} x={index*10} y="0" width="10" height="20"/>)}</>}
    </svg>;
}

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
    const [open, setOpen] = useState(false);
    const root = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const items = useRef<(HTMLButtonElement | null)[]>([]);
    const selected = languages.find(language => language.code === panelLanguage)!;
    useEffect(() => {
        if (!open) return;
        items.current[languages.indexOf(selected)]?.focus();
        const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open]);
    return <div ref={root} className={`${styles.root} vinus-language`} onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
    }} onKeyDown={event => {
        if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
        if (!open) return;
        const index = items.current.indexOf(document.activeElement as HTMLButtonElement);
        const next = event.key === 'ArrowDown' ? (index+1)%languages.length : event.key === 'ArrowUp' ? (index-1+languages.length)%languages.length : event.key === 'Home' ? 0 : event.key === 'End' ? languages.length-1 : -1;
        if (next >= 0) { event.preventDefault(); items.current[next]?.focus(); }
    }}>
        <button ref={trigger} type="button" className={styles.trigger} aria-label={`${vt('Langue')} · ${selected.name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)} onKeyDown={event => { if (!open && (event.key==='ArrowDown'||event.key==='ArrowUp')) { event.preventDefault(); setOpen(true); } }}>
            <LanguageFlag code={panelLanguage}/><span>{compact ? panelLanguage.toUpperCase() : selected.name}</span><svg className={styles.chevron} viewBox="0 0 12 12" aria-hidden="true"><path d="m3 4.5 3 3 3-3"/></svg>
        </button>
        {open && <div className={styles.menu} role="menu" aria-label={vt('Choisir la langue')}>
            <p className={styles.heading}>{vt('Langue')}</p>
            {languages.map((language,index)=><button ref={element=>{items.current[index]=element;}} key={language.code} role="menuitemradio" aria-checked={language.code===panelLanguage} type="button" onClick={()=>{setOpen(false);trigger.current?.focus();changeLanguage(language.code);}}>
                <LanguageFlag code={language.code}/><span lang={language.code}>{language.name}</span><small>{language.code.toUpperCase()}</small><span className={styles.check} aria-hidden="true">{language.code===panelLanguage?'✓':''}</span>
            </button>)}
        </div>}
    </div>;
}
