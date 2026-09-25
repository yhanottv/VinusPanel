import React, { useState } from 'react';
import { useField } from 'formik';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import { vt } from '@/locales/translate';
import styles from './account.module.css';

type Props = { id: string; name: string; label: string; type: 'email' | 'password'; description?: string; autoComplete?: string };

export default function AccountField({ id, name, label, type, description, autoComplete }: Props) {
    const [field, meta] = useField<string>(name);
    const [visible, setVisible] = useState(false);
    const error = meta.touched && meta.error;
    const password = type === 'password';
    return <div className={styles.field}>
        <Label htmlFor={id}>{label}</Label>
        <div className={styles.inputWrap}>
            <svg className={styles.fieldIcon} viewBox="0 0 24 24" aria-hidden="true">
                {password ? <path d="M15 3a6 6 0 0 0-5.5 8.5L3 18v3h3v-3h3v-3l2.5-2.5A6 6 0 1 0 15 3Zm2 4h.01"/> : <><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1A10 10 0 1 0 18 20"/></>}
            </svg>
            <Input {...field} id={id} type={password && visible ? 'text' : type} autoComplete={autoComplete}
                hasError={!!error} aria-invalid={!!error} aria-describedby={error || description ? `${id}-help` : undefined}/>
            {password && <button type="button" className={styles.reveal} aria-label={`${vt(visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe')} — ${label}`}
                aria-pressed={visible} aria-controls={id} onClick={() => setVisible(value => !value)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">{visible ? <><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9 5.4A11.8 11.8 0 0 1 12 5c6 0 10 7 10 7a18 18 0 0 1-3 3.7M6.1 6.1C3.5 8 2 12 2 12s4 7 10 7a11 11 0 0 0 5-1.3"/></> : <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>}</svg>
            </button>}
        </div>
        {(error || description) && <p id={`${id}-help`} className={`input-help${error ? ' error' : ''}`}>{error || description}</p>}
    </div>;
}
