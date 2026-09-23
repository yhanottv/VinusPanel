import React, { useRef } from 'react';
import { minecraftColors, parseMotd, formatMotdSelection } from './motd';
import SoftwareIcon from './SoftwareIcon';
import { vt } from '@/locales/translate';
import styles from './properties.module.css';

export default function MotdEditor({ value, onChange, disabled, name, software }: { value: string; onChange: (value: string) => void; disabled: boolean; name: string; software?: string | null }) {
    const input = useRef<HTMLTextAreaElement>(null);
    const selection = useRef({ start: value.length, end: value.length });
    const format = (code: string) => {
        const edit = formatMotdSelection(value, selection.current.start, selection.current.end, code);
        onChange(edit.value);
        requestAnimationFrame(() => { input.current?.focus(); input.current?.setSelectionRange(edit.caret, edit.caret); });
    };
    return <section className={styles.motd}>
        <h3>{vt('Message du jour')}</h3><p>{vt('Sélectionnez du texte puis une couleur ou un style. Entrée ajoute une deuxième ligne.')}</p>
        <div className={styles.preview} aria-label={vt('Aperçu du message Minecraft')}>
            <SoftwareIcon software={software} size={56} /><div><strong>{name}</strong><div className={styles.minecraftText}>{parseMotd(value).map((part, i) => <span key={i} style={{ color: part.color, fontWeight: part.bold ? 700 : undefined, fontStyle: part.italic ? 'italic' : undefined, textDecoration: [part.underline ? 'underline' : '', part.strike ? 'line-through' : ''].filter(Boolean).join(' ') || undefined }}>{part.obfuscated ? part.text.replace(/\S/g, '▒') : part.text}</span>)}</div></div>
        </div>
        <div className={styles.formatbar} role="group" aria-label={vt('Couleurs et styles du message')}>
            {Object.entries(minecraftColors).map(([code, color]) => <button key={code} type="button" disabled={disabled} style={{ color }} aria-label={`${vt('Couleur')} ${code}`} onMouseDown={e => e.preventDefault()} onClick={() => format(code)}>{code}</button>)}
            {[['l','B','Gras'],['o','I','Italique'],['n','U','Souligné'],['m','S','Barré'],['k','▒','Obfusqué'],['r','↺','Réinitialiser le style']].map(([code, label, title]) => <button type="button" key={code} disabled={disabled} title={vt(title)} aria-label={vt(title)} onMouseDown={e => e.preventDefault()} onClick={() => format(code)}>{label}</button>)}
        </div>
        <textarea ref={input} rows={2} aria-label={vt('Message affiché dans la liste des serveurs')} value={value} disabled={disabled} onChange={e => onChange(e.target.value)} onSelect={e => { selection.current = { start: e.currentTarget.selectionStart, end: e.currentTarget.selectionEnd }; }} spellCheck={false} />
    </section>;
}
