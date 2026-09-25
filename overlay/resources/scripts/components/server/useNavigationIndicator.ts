import { useLayoutEffect, useRef, useState } from 'react';

interface Position { x: number; y: number; width: number; height: number; }

export default function useNavigationIndicator(dependencies: unknown[]) {
    const ref = useRef<HTMLElement>(null);
    const [position, setPosition] = useState<Position | null>(null);
    useLayoutEffect(() => {
        const nav = ref.current;
        if (!nav) return;
        const update = () => {
            const active = nav.querySelector<HTMLElement>('a[aria-current="page"]');
            if (!active || !active.getClientRects().length) { setPosition(null); return; }
            const rect = active.getBoundingClientRect();
            const parent = nav.getBoundingClientRect();
            const next = { x: rect.left - parent.left + nav.scrollLeft, y: rect.top - parent.top + nav.scrollTop, width: rect.width, height: rect.height };
            setPosition(current => current && Object.keys(next).every(key => current[key as keyof Position] === next[key as keyof Position]) ? current : next);
        };
        update();
        const resize = new ResizeObserver(update);
        resize.observe(nav);
        Array.from(nav.querySelectorAll('a,button')).forEach(element => resize.observe(element));
        window.addEventListener('resize', update);
        return () => { resize.disconnect(); window.removeEventListener('resize', update); };
    }, dependencies);
    return { ref, position };
}
