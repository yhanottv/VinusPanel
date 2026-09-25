import React, { useEffect, useRef, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import http, { httpErrorToHuman } from '@/api/http';
import { designPreview } from '@/designRuntime';
import { vt } from '@/locales/translate';
import CompanionChoice, { CompanionOffer } from './CompanionChoice';
import { activateCompanion, CompanionStage, companionEvent, pendingCompanion, dismissCompanion } from './companionFollowup';

export default function PlayerCompanionPrompt() {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const status = ServerContext.useStoreState(s => s.status.value);
    const user = useStoreState(s => s.user.data!.uuid);
    const canPower = usePermissions(['control.start', 'control.stop']).every(Boolean);
    const [pending, setPending] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [offer, setOffer] = useState<CompanionOffer | null>(null);
    const [error, setError] = useState('');
    const [stage, setStage] = useState<CompanionStage>('');
    const [result, setResult] = useState('');
    const seen = useRef(''), alive = useRef(true), working = useRef(false);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    useEffect(() => {
        const sync = () => setPending(pendingCompanion(user, server.uuid));
        sync(); window.addEventListener(companionEvent, sync); window.addEventListener('storage', sync);
        return () => { window.removeEventListener(companionEvent, sync); window.removeEventListener('storage', sync); };
    }, [user, server.uuid]);
    useEffect(() => {
        if (designPreview || !pending || status !== 'running' || seen.current === pending) return;
        seen.current = pending; setOpen(true); setOffer(null); setError(''); setStage(''); setResult('');
    }, [pending, status, server.uuid]);
    useEffect(() => {
        if (!open || !pending || designPreview) return;
        let active = true;
        http.get(`/api/client/extensions/vinuscatalog/servers/${server.uuid}/players/companion`)
            .then(({ data }) => { if (active) setOffer(data); })
            .catch(e => { if (active) setError(httpErrorToHuman(e)); });
        return () => { active = false; };
    }, [open, pending, server.uuid]);
    const close = () => {
        if (working.current) return;
        if (pending) dismissCompanion(user, server.uuid, pending);
        setOpen(false);
    };
    const install = async () => {
        if (working.current || !offer?.supported || !offer.can_install || !canPower || designPreview) return;
        working.current = true; setError('');
        try {
            const outcome = await activateCompanion(server.uuid, value => { if (alive.current) setStage(value); });
            if (pending) dismissCompanion(user, server.uuid, pending);
            if (alive.current) setResult(outcome);
        } catch (e) {
            if (alive.current) setError(e instanceof Error && e.message.startsWith('companion_')
                ? vt(e.message === 'companion_stop_timeout' ? 'Le serveur ne s’est pas arrêté à temps. Rien n’a été installé et aucun arrêt forcé n’a été effectué.' : 'La liaison ne peut pas être activée maintenant. Vérifiez la compatibilité, les permissions et l’état du serveur dans la console.')
                : httpErrorToHuman(e));
        } finally { working.current = false; if (alive.current) setStage(''); }
    };
    return <CompanionChoice open={open} offer={offer} canPower={canPower} stage={stage} error={error} result={result} onClose={close} onInstall={install} serverId={server.id}/>;
}
