import React from 'react';
import { vt } from '@/locales/translate';
import styles from './server.module.css';
export default function VinusCatalogEntry({ kind }: { kind: 'mods' | 'plugins' }) {
    return <div className={styles.empty}>{vt('Le catalogue nécessite l’extension VinusCatalog.')} ({kind})</div>;
}
