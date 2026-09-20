import React from 'react';
import Icon from '@/components/elements/Icon';
import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import styles from './style.module.css';
import useFitText from 'use-fit-text';
import CopyOnClick from '@/components/elements/CopyOnClick';

interface StatBlockProps {
    title: string;
    copyOnClick?: string;
    color?: string | undefined;
    icon: IconDefinition;
    children: React.ReactNode;
    className?: string;
    progress?: number;
    accent?: string;
}

export default ({ title, copyOnClick, icon, color, className, progress, accent, children }: StatBlockProps) => {
    const { fontSize, ref } = useFitText({ minFontSize: 8, maxFontSize: 500 });
    const ringStyle = {
        '--progress': Math.max(0, Math.min(100, progress ?? 8)),
        '--accent': accent || '#ff7a1a',
    } as React.CSSProperties;

    return (
        <CopyOnClick text={copyOnClick}>
            <div className={classNames(styles.stat_block, className)}>
                <div className={classNames(styles.status_bar, color || 'bg-primary-400')} />
                <div className={styles.icon} style={ringStyle}>
                    <Icon icon={icon} />
                </div>
                <div className={'relative z-10 flex w-full min-w-0 flex-col justify-center overflow-hidden'}>
                    <p className={'font-header text-xs font-medium leading-tight text-gray-400'}>{title}</p>
                    <div
                        ref={ref}
                        className={'mt-1 h-[1.75rem] w-full truncate font-semibold text-gray-50'}
                        style={{ fontSize }}
                    >
                        {children}
                    </div>
                </div>
            </div>
        </CopyOnClick>
    );
};
