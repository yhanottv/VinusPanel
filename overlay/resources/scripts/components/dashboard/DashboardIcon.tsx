import React from 'react';

const paths = {
    grid: 'M3 3h5v5H3z M12 3h5v5h-5z M3 12h5v5H3z M12 12h5v5h-5z',
    user: 'M13 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M4 18v-3a6 6 0 0 1 12 0v3',
    key: 'M12 3a5 5 0 0 0-4.6 7L2 15.5V18h3v-2h2v-2l3-3a5 5 0 1 0 2-8 M14 6h.01',
    terminal: 'm3 5 5 5-5 5 M11 15h6',
    activity: 'M2 10h4l2-7 4 14 2-7h4',
    chevron: 'm8 5 5 5-5 5',
    down: 'm5 8 5 5 5-5',
    globe: 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M2 10h16 M10 2c4 4 4 12 0 16-4-4-4-12 0-16',
    help: 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M4.3 4.3l3.6 3.6 M12.1 12.1l3.6 3.6 M4.3 15.7l3.6-3.6 M12.1 7.9l3.6-3.6',
    palette: 'M18 10a8 8 0 1 0-8 8h1a2 2 0 0 0 1-3.7c-1-.5-.4-2.3.8-2.3H16a2 2 0 0 0 2-2 M6 7h.01 M10 5h.01 M14 7h.01 M5 11h.01',
    sun: 'M13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0 M10 1v2 M10 17v2 M1 10h2 M17 10h2 M3.6 3.6 5 5 M15 15l1.4 1.4 M3.6 16.4 5 15 M15 5l1.4-1.4',
    moon: 'M17 12A8 8 0 0 1 8 3a8 8 0 1 0 9 9',
    brush: 'm8 11 8-8a2 2 0 0 1 2 2l-8 8 M8 11l2 2 M8 11c-5-2-4 5-6 6 5 1 9-1 8-4',
    logout: 'M8 3H3v14h5 M8 10h10 M14 6l4 4-4 4',
    search: 'M14 8.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0 M12.5 12.5 18 18',
    plus: 'M10 4v12 M4 10h12',
    controls: 'M3 5h14 M3 10h14 M3 15h14 M7 3v4 M13 8v4 M7 13v4',
    server: 'M3 3h14v6H3z M3 11h14v6H3z M6 6h.01 M6 14h.01',
    info: 'M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0 M10 9v5 M10 6h.01',
    close: 'm5 5 10 10 M15 5 5 15',
    check: 'm4 10 4 4 8-8',
    menu: 'M3 5h14 M3 10h14 M3 15h14',
    list: 'M7 5h10 M7 10h10 M7 15h10 M3 5h.01 M3 10h.01 M3 15h.01',
    external: 'M12 3h5v5 M17 3l-8 8 M8 3H3v14h14v-5',
    discord: 'M6 4 3 5 1 14l4 2 1-2 M14 4l3 1 2 9-4 2-1-2 M5 13c3 2 7 2 10 0 M6 5c3-1 5-1 8 0 M7 10h.01 M13 10h.01',
} as const;

export type DashboardIconName = keyof typeof paths;
export default function DashboardIcon({ name, className }: { name: DashboardIconName; className?: string }) {
    return <svg className={className} width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
