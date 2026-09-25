import React, { useState } from 'react';
import { vt } from '@/locales/translate';
import styles from './message-box.module.css';

export type FlashMessageType = 'success' | 'info' | 'warning' | 'error';

interface Props {
    title?: string;
    children: React.ReactNode;
    type?: FlashMessageType;
    onDismiss?: () => void;
    dismissible?: boolean;
    className?: string;
}

const titles: Record<string, string> = { Error: 'Erreur', Success: 'Succès', Warning: 'Attention', Info: 'Information' };

export default function MessageBox({ title, children, type = 'info', onDismiss, dismissible = false, className = '' }: Props) {
    const [dismissed, setDismissed] = useState(false);
    if (dismissed) return null;
    return <div className={`${styles.notice} ${className}`} data-type={type} role={type === 'error' || type === 'warning' ? 'alert' : 'status'} aria-atomic="true">
        <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {type === 'warning' ? <><path d="M10.3 3.5 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4 M12 17h.01"/></> : <>
                <circle cx="12" cy="12" r="9"/>
                {type === 'error' ? <path d="m9 9 6 6 M15 9l-6 6"/> : type === 'success' ? <path d="m8 12 3 3 5-6"/> : <path d="M12 11v5 M12 7h.01"/>}
            </>}
        </svg>
        <div className={styles.content}>
            {title && <strong className={styles.title}>{vt(titles[title] || title)}</strong>}
            <div>{children}</div>
        </div>
        {(onDismiss || dismissible) && <button type="button" className={styles.close} aria-label={vt('Fermer la notification')} onClick={onDismiss || (() => setDismissed(true))}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><path d="m6 6 8 8 M14 6l-8 8"/></svg>
        </button>}
    </div>;
}
