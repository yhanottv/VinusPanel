import { vt } from '@/locales/translate';
import React from 'react';
import styles from '@/components/server/console/style.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface ChartBlockProps {
    title: string;
    children: React.ReactNode;
    value: string;
    meta: string;
    secondaryValue?: string;
    icon: IconProp;
}

export default ({ title, value, meta, secondaryValue, icon, children }: ChartBlockProps) => (
    <section className={styles.chart_container} aria-label={title}>
        <h3 className={styles.chart_label}>
            <FontAwesomeIcon icon={icon} fixedWidth />{title}
        </h3>
        <div className={styles.chart_metrics}>
            <div>
                <p className={styles.chart_value}>{value}</p>
                <p className={styles.chart_meta}>
                    {secondaryValue && <span className={styles.chart_inbound} aria-hidden={'true'}>↓ </span>}{meta}
                </p>
            </div>
            {secondaryValue && <div>
                <p className={styles.chart_value}>{secondaryValue}</p>
                <p className={styles.chart_meta}><span className={styles.chart_outbound} aria-hidden={'true'}>↑ </span>{vt("Sortant")}</p>
            </div>}
        </div>
        <div className={styles.chart_canvas}>{children}</div>
    </section>
);
