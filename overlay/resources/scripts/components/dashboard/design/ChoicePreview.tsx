import React from 'react';
import { DesignOptions } from '@/designOptions';
import Icon from '@/components/dashboard/DashboardIcon';
import styles from './choice-preview.module.css';

// Schematic drawings stay crisp at every editor width. Each choice illustrates its
// actual layout, rather than loading screenshots of a particular installation.
export default function ChoicePreview({ field, value, duration, tick }: {
    field: keyof DesignOptions; value: string; duration: number; tick: number;
}) {
    const box = (x: number, y: number, width: number, height: number, accent = false, radius = 3) =>
        <rect x={x} y={y} width={width} height={height} rx={radius} fill={accent ? 'var(--mini-accent)' : 'currentColor'} />;
    const line = (x: number, y: number, width: number, accent = false) => box(x, y, width, 4, accent, 1.5);
    const rows = (x = 13, width = 19) => <>{line(x, 16, width, true)}{line(x, 26, width)}{line(x, 36, width)}{line(x, 46, width)}</>;
    const card = (x = 48, y = 30, width = 98, height = 30) => <>{line(x, y - 12, width * .65)}{box(x, y, width, height)}</>;
    let drawing: React.ReactNode;

    if (['body_font', 'heading_font', 'mono_font'].includes(field)) {
        const fonts: Record<string, string> = { system: 'system-ui', montserrat: 'Vinus Montserrat', arial: 'Arial', georgia: 'Georgia', mono: 'monospace', consolas: 'Consolas, monospace', courier: 'Courier New, monospace' };
        return <span aria-hidden="true" className={styles.sample} style={{ fontFamily: fonts[value] }}><strong>Aa</strong><small>Abc 0123</small></span>;
    }
    if (field === 'default_language') return <span aria-hidden="true" className={styles.sample}><strong>{value === 'fr' ? 'Bonjour' : 'Hello'}</strong><small>{value === 'fr' ? 'Votre espace' : 'Your workspace'}</small></span>;
    if (field === 'icon_family' || field === 'icon_style') return <span aria-hidden="true" className={`${styles.sample} ${styles.icons}`} data-corners={field === 'icon_style' ? value : 'round'}><Icon name="user" family={field === 'icon_family' ? value : 'outline'} /><Icon name="grid" family={field === 'icon_family' ? value : 'outline'} /><Icon name="server" family={field === 'icon_family' ? value : 'outline'} /></span>;

    switch (field) {
        case 'logo_mode': drawing = <g transform="translate(35 24)">{value !== 'text' && box(0, 0, 23, 23, true, 5)}{value !== 'art' && <>{line(value === 'both' ? 31 : 0, 3, 57)}{line(value === 'both' ? 31 : 0, 13, 38)}</>}</g>; break;
        case 'content_width': {
            const x = value === 'contained' ? 63 : value === 'wide' ? 45 : 33;
            drawing = <>{box(5, 7, 23, 58)}{rows(11, 11)}{card(x, 25, value === 'contained' ? 57 : value === 'wide' ? 100 : 121, 40)}</>; break;
        }
        case 'sidebar_style': {
            const compact = value === 'compact', rail = value === 'rail', floating = value === 'floating';
            const width = rail ? 18 : compact ? 28 : 38;
            drawing = <><g className={styles.dim}>{box(floating ? 7 : 2, floating ? 9 : 2, width, floating ? 54 : 68)}</g>{rows(rail ? 8 : 11, rail ? 5 : compact ? 15 : 23)}{value === 'bordered' && <path d="M43 2v68" stroke="currentColor" />}{card(width + 12, 29, 137 - width, 33)}</>; break;
        }
        case 'active_link': drawing = <><g className={styles.dim}>{box(22, 7, 116, 58)}</g>{line(45, 17, 67)}{line(45, 53, 56)}<g className={styles.link} data-variant={value}>{box(29, 29, 102, 17, true, value === 'pill' ? 9 : 4)}</g>{box(35, 34, 6, 6, true)}{line(48, 35, 72, true)}{value === 'edge' && box(24, 31, 2, 13, true)}{value === 'underline' && box(29, 47, 102, 2, true)}{value === 'dot' && box(24, 35, 3, 3, true)}</>; break;
        case 'border': drawing = <g className={styles.border} data-variant={value}>{box(20, 11, 120, 50)}{line(33, 25, 59)}{line(33, 38, 90)}{line(33, 48, 74)}</g>; break;
        case 'shadow': drawing = <g className={styles.shadow} data-variant={value}>{box(29, 12, 102, 44)}{line(43, 24, 60)}{line(43, 37, 76)}</g>; break;
        case 'search_style': drawing = <>{rows(8, 16)}<g className={styles.search} data-variant={value}>{box(36, 10, value === 'full' ? 115 : 76, 19, false, value === 'pill' ? 10 : 4)}</g><circle cx="45" cy="18" r="3" fill="none" stroke="var(--mini-accent)" /><path d="m47 20 3 3" stroke="var(--mini-accent)" />{line(58, 17, value === 'full' ? 72 : 40)}{box(36, 38, 115, 25)}</>; break;
        case 'login_layout': {
            const centered = value === 'center' || value === 'top';
            const x = centered ? 57 : value === 'left' ? 17 : 94;
            drawing = <>{value !== 'center' && <g>{line(value === 'right' ? 15 : value === 'top' ? 56 : 80, value === 'top' ? 9 : 24, 48)}{line(value === 'right' ? 15 : value === 'top' ? 64 : 80, value === 'top' ? 17 : 34, 32)}</g>}<g className={styles.form}>{box(x, value === 'top' ? 28 : 12, 48, value === 'top' ? 38 : 50)}{line(x + 7, value === 'top' ? 35 : 23, 31)}{line(x + 7, value === 'top' ? 44 : 34, 31)}{box(x + 7, value === 'top' ? 53 : 45, 31, 8, true)}</g></>; break;
        }
        case 'login_surface': drawing = <g className={styles.loginSurface} data-variant={value}>{box(39, 7, 82, 58)}{line(49, 20, 36)}{box(49, 31, 62, 8)}{box(49, 44, 62, 10, true)}</g>; break;
        case 'login_align': drawing = <g className={styles.alignment}>{box(29, 8, 102, 57)}{line(value === 'center' ? 53 : 39, 18, 54)}{line(value === 'center' ? 63 : 39, 28, 34)}{box(39, 39, 82, 7)}{box(39, 52, 82, 7, true)}</g>; break;
        case 'login_backdrop': drawing = <><rect width="160" height="72" className={styles.backdrop} data-variant={value} />{value === 'games' && <g transform="translate(73 -10) rotate(-9)">{[0,1,2].map(column=><g key={column} transform={`translate(${column*29} 0)`}>{[0,1,2,3].map(row=><g key={row}>{box(0,row*24,25,19,row%2===0)}</g>)}</g>)}</g>}{value === 'grid' && <path d="M20 0v72 M40 0v72 M60 0v72 M80 0v72 M100 0v72 M120 0v72 M140 0v72 M0 18h160 M0 36h160 M0 54h160" stroke="currentColor" />}{value === 'image' && <path d="M0 65 45 23 85 57 118 27 160 65" fill="currentColor" />}{box(value==='games'?12:61,17,38,40)}{box(value==='games'?18:67,44,26,6,true)}</>; break;
        case 'server_view': drawing = value === 'grid' ? <>{[9, 59, 109].map(x => <g key={x}>{box(x, 13, 42, 47)}{line(x + 7, 23, 23, true)}{line(x + 7, 34, 28)}{line(x + 7, 47, 18)}</g>)}</> : <>{[10, 30, 50].map(y => <g key={y}>{box(9, y, 142, 14)}{box(14, y + 4, 6, 6, true)}{line(27, y + 5, 57)}{line(129, y + 5, 16, true)}</g>)}</>; break;
        case 'notice_style': drawing = <g className={styles.notice} data-variant={value}>{box(9, 20, 142, 31)}{box(17, 29, 10, 10, true)}{line(36, 29, 79)}{line(36, 39, 57)}{value === 'edge' && box(9, 20, 3, 31, true)}</g>; break;
        case 'server_nav': drawing = <>{box(3, 5, 26, 62)}{rows(9, 14)}{value === 'second' ? <>{box(34, 5, 26, 62)}{rows(40, 14)}{card(67, 30, 86, 34)}</> : value === 'top' ? <>{box(36, 8, 117, 12, true)}{card(36, 39, 117, 25)}</> : card(36, 28, 117, 37)}</>; break;
        case 'power_style': drawing = <g className={styles.power} data-variant={value}>{[19, 61, 103].map((x, i) => <g key={x}>{box(x, 22, 35, 29, true, 5)}<path d={i === 0 ? `M${x + 13} 31l10 6-10 6z` : i === 1 ? `M${x + 23} 32a8 8 0 1 0 0 10 M${x + 23} 27v7h-7` : `M${x + 13} 32h10v10h-10z`} fill="none" stroke="var(--mini-ink)" strokeWidth="2" /></g>)}</g>; break;
        case 'console_usage': {
            const horizontal = value === 'above' || value === 'below';
            drawing = <>{box(value === 'left' ? 43 : 8, value === 'above' ? 28 : 9, horizontal ? 144 : 108, horizontal ? 34 : 54)}{[0, 1, 2].map(i => <g key={i}>{box(horizontal ? 8 + i * 50 : value === 'left' ? 8 : 122, horizontal ? value === 'above' ? 8 : 49 : 9 + i * 20, horizontal ? 44 : 30, 14, true)}</g>)}</>; break;
        }
        case 'console_charts': drawing = <>{box(9, value === 'above' ? 31 : 9, 142, value === 'none' ? 54 : 32)}{value !== 'none' && <path d={value === 'above' ? 'M12 24 32 15 46 22 64 9 78 19 95 11 115 25 136 15 149 18' : 'M12 62 32 53 46 60 64 47 78 57 95 49 115 63 136 53 149 56'} fill="none" stroke="var(--mini-accent)" strokeWidth="2" />}</>; break;
        case 'chart_shape': drawing = <><path d="M14 12v49h133" fill="none" stroke="currentColor" />{value === 'line' ? <path d="m16 51 23-18 23 10 23-23 23 12 35-22" fill="none" stroke="var(--mini-accent)" strokeWidth="2" /> : [25, 40, 33, 49, 28, 43].map((h, i) => <g key={i}>{box(23 + i * 20, 60 - h, 12, h, true, 1)}</g>)}</>; break;
        case 'page_motion': drawing = <g key={tick} className={styles.pageMotion} data-motion={value}>{box(20, 10, 120, 52)}{line(30, 20, 57, true)}{box(30, 32, 42, 20)}{box(80, 32, 50, 20)}</g>; break;
        case 'button_motion': drawing = <g key={tick} className={styles.buttonMotion} data-motion={value}>{box(41, 24, 78, 25, true, 6)}<path d="M71 36h18 M80 31v10" stroke="var(--mini-ink)" strokeWidth="2" /></g>; break;
        default: return null;
    }
    return <span aria-hidden="true" className={styles.canvas} style={{ '--demo-duration': `${Math.max(120, duration)}ms` } as React.CSSProperties}><svg viewBox="0 0 160 72" fill="none">{drawing}</svg></span>;
}
