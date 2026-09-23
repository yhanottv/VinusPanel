import { useEffect } from 'react';
import { ServerContext } from '@/state/server';
import getServerResourceUsage from '@/api/server/getServerResourceUsage';

// Offline Wings instances may not emit a status until logs are requested.
// Initialize power controls on every server page without requesting console logs.
export default function ServerStatusBootstrap() {
    const uuid = ServerContext.useStoreState(s => s.server.data!.uuid);
    const { connected, instance } = ServerContext.useStoreState(s => s.socket);
    const setStatus = ServerContext.useStoreActions(a => a.status.setServerStatus);
    useEffect(() => { setStatus(null); }, [uuid]);
    useEffect(() => {
        if (!connected || !instance) return;
        let active = true;
        let newerSocketStatus = false;
        const onStatus = () => { newerSocketStatus = true; };
        instance.addListener('status', onStatus);
        getServerResourceUsage(uuid).then(stats => {
            if (active && !newerSocketStatus) setStatus(stats.status);
        }).catch(() => { /* Commands stay disabled until a confirmed status arrives. */ });
        return () => { active = false; instance.removeListener('status', onStatus); };
    }, [uuid, instance, connected]);
    return null;
}
