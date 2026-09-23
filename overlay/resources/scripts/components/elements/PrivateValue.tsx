import React from 'react';
import styles from './private-value.module.css';

/** Visual privacy for screen sharing; hover, keyboard focus and touch reveal the value. */
export default function PrivateValue({ children, block = false }: { children: React.ReactNode; block?: boolean }) {
    return <span className={styles.reveal} data-block={block || undefined} tabIndex={0}>
        <span className={styles.value}>{children}</span>
    </span>;
}
