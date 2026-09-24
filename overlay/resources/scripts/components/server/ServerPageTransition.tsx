import React, { useLayoutEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useDesign } from '@/designRuntime';

// Animate the existing outlet, never key/remount the server context or its socket.
export default function ServerPageTransition({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const { pathname } = useLocation();
    const { options } = useDesign();
    useLayoutEffect(() => {
        const node = ref.current;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (!node?.animate || reduced.matches || options.page_motion === 'none') return;
        const transform = options.page_motion === 'slide' ? 'translateX(18px)' : options.page_motion === 'rise' ? 'translateY(12px)' : options.page_motion === 'scale' ? 'scale(.985)' : 'none';
        const animation = node.animate([
            { opacity: 0, transform }, { opacity: 1, transform: 'none' },
        ], { duration: options.motion_duration, easing: 'cubic-bezier(.22,1,.36,1)' });
        const stop = () => { if (reduced.matches) animation.cancel(); };
        reduced.addEventListener('change', stop);
        return () => { animation.cancel(); reduced.removeEventListener('change', stop); };
    }, [pathname, options.page_motion, options.motion_duration]);
    return <div ref={ref}>{children}</div>;
}
