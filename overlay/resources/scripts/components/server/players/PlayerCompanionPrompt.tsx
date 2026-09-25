import React, { useEffect, useRef, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import http, { httpErrorToHuman } from '@/api/http';
import { designPreview } from '@/designRuntime';
import { vt } from '@/locales/translate';
import CompanionChoice, { CompanionOffer } from './CompanionChoice';
import { activateCompanion, CompanionStage, companionEvent, pendingCompanion, dismissCompanion, queueCompanion } from './companionFollowup';

export default function PlayerCompanionPrompt() {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const status = ServerContext.useStoreState(s => s.status.value);
    const user = useStoreState(s => s.user.data!.uuid);
    const canPower = usePermissions(['control.start', 'control.stop']).every(Boolean);
    const canRead = usePermissions(['file.read-content'])[0];
    const [pending, setPending] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const [offer, setOffer] = useState<CompanionOffer | null>(null);
    const [error, setError] = useState('');
    const [stage, setStage] = useState<CompanionStage>('');
    const [result, setResult] = useState('');
    const seen = useRef(''), alive = useRef(true), working = useRef(false);
    const reminderRead = useRef(0);
    useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
    useEffect(() => {
        const sync = () => setPending(pendingCompanion(user, server.uuid));
        sync(); window.addEventListener(companionEvent, sync); window.addEventListener('storage', sync);
        return () => { window.removeEventListener(companionEvent, sync); window.removeEventListener('storage', sync); };
    }, [user, server.uuid]);
    useEffect(() => {
        if (designPreview || !canRead) return;
        let active = true;
        const restore = () => {
            if (working.current) return;
            const request = ++reminderRead.current;
            const local = pendingCompanion(user, server.uuid);
            http.get(`/api/client/extensions/vinuscatalog/servers/${server.uuid}/players/companion/followup`)
                .then(({ data }) => {
                    if (!active || request !== reminderRead.current) return;
                    if (typeof data.pending === 'string') queueCompanion(user, server.uuid, data.pending);
                    // Clear an acknowledged server token, but preserve a manual/local-only invitation.
                    else if (data.pending === null && local && /^\d+:[a-zA-Z0-9]{32}$/.test(local)) dismissCompanion(user, server.uuid, local);
                })
                .catch(() => { /* The browser reminder remains available if this request fails. */ });
        };
        restore(); window.addEventListener('focus', restore);
        return () => { active = false; window.removeEventListener('focus', restore); };
    }, [user, server.uuid, status, canRead]);
    useEffect(() => {
        if (!pending && !working.current && !result) setOpen(false);
    }, [pending, result]);
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
    const acknowledge = async () => {
        if (!pending) return;
        ++reminderRead.current;
        await http.post(`/api/client/extensions/vinuscatalog/servers/${server.uuid}/players/companion/followup/dismiss`, { token: pending });
        dismissCompanion(user, server.uuid, pending);
    };
    const close = async () => {
        if (working.current) return;
        working.current = true;
        try { await acknowledge(); if (alive.current) { setPending(null); setOpen(false); } }
        catch (e) { if (alive.current) setError(httpErrorToHuman(e)); }
        finally { working.current = false; }
    };
    const install = async () => {
        if (working.current || !offer?.supported || !offer.can_install || !canPower || designPreview) return;
        working.current = true; setError('');
        try {
            const outcome = await activateCompanion(server.uuid, value => { if (alive.current) setStage(value); });
            await acknowledge();
            if (alive.current) setResult(outcome);
        } catch (e) {
            if (alive.current) setError(e instanceof Error && e.message.startsWith('companion_')
                ? vt(e.message === 'companion_stop_timeout' ? 'Le serveur ne s’est pas arrêté à temps. Rien n’a été installé et aucun arrêt forcé n’a été effectué.' : 'La liaison ne peut pas être activée maintenant. Vérifiez la compatibilité, les permissions et l’état du serveur dans la console.')
                : httpErrorToHuman(e));
        } finally { working.current = false; if (alive.current) setStage(''); }
    };
    return <CompanionChoice open={open} offer={offer} canPower={canPower} stage={stage} error={error} result={result} onClose={close} onInstall={install} serverId={server.id}/>;
}
