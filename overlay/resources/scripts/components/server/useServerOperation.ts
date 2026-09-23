import { useEffect, useRef } from 'react';
import { ServerContext } from '@/state/server';

/** Long installations may finish after the user has navigated to another server. */
export default function useServerOperation(uuid: string) {
    const store = ServerContext.useStore();
    const mounted = useRef(false);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    const sameServer = () => store.getState().server.data?.uuid === uuid;
    return {
        current: () => mounted.current && sameServer(),
        reconnect: () => {
            if (!sameServer()) return;
            // Wings permanently closes the previous connection during temporary suspension.
            const socket = store.getState().socket.instance;
            socket?.removeAllListeners(); socket?.close();
            store.getActions().socket.setConnectionState(false);
            store.getActions().socket.setInstance(null);
        },
    };
}
