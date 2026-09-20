import React from 'react';
import classNames from 'classnames';
import styles from '@/components/server/console/style.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface ChartBlockProps {
    title: string;
    legend?: React.ReactNode;
    children: React.ReactNode;
    value: string;
    meta: string;
    icon: IconProp;
}

export default ({ title, legend, value, meta, icon, children }: ChartBlockProps) => (
    <div className={classNames(styles.chart_container, 'group')}>
        <div className={styles.chart_header}>
            <div>
                <h3 className={styles.chart_label}>
                    <FontAwesomeIcon icon={icon} fixedWidth />
                    {title}
                </h3>
                <p className={styles.chart_value}>{value}</p>
            </div>
            <div className={styles.chart_meta}>
                <p>{meta}</p>
                {legend && <p className={'mt-2 flex items-center justify-end'}>{legend}</p>}
            </div>
        </div>
        <div className={styles.chart_canvas}>{children}</div>
    </div>
);
