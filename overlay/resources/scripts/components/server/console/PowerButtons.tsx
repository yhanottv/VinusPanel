import { vt } from '@/locales/translate';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/elements/button/index';
import Can from '@/components/elements/Can';
import { ServerContext, ServerStatus } from '@/state/server';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRedoAlt, faStop } from '@fortawesome/free-solid-svg-icons';

import { availablePowerActions } from './powerState';

interface PowerButtonProps {
    variant?: 'toolbar' | 'deck';
    className?: string;
    status?: ServerStatus;
    connected?: boolean;
}

type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

export default ({
    className,
    variant = 'toolbar',
    status: currentStatus,
    connected: currentConnection,
}: PowerButtonProps) => {
    const [open, setOpen] = useState(false);
    const storedStatus = ServerContext.useStoreState((state) => state.status.value);
    const status = currentStatus === undefined ? storedStatus : currentStatus;
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const storedConnection = ServerContext.useStoreState((state) => state.socket.connected);
    const connected = currentConnection === undefined ? storedConnection : currentConnection;
    const blocked = ServerContext.useStoreState((state) => state.server.inConflictState);
    const allowed = availablePowerActions(status, connected, blocked);
    const deck = variant === 'deck';
    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
        e.preventDefault();
        const requested = action === 'kill-confirmed' ? 'kill' : action;
        if (!allowed[requested]) return;
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status !== 'stopping' || !connected || blocked) {
            setOpen(false);
        }
    }, [status, connected, blocked]);

    return (
        <div className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={vt("Forcer l’arrêt du serveur")}
                confirm={vt("Continuer")}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >{vt("Un arrêt forcé peut endommager les données en cours d’écriture.")}</Dialog.Confirm>
            {(!deck || status === 'offline' || !status) && (
                <Can action={'control.start'}>
                    <Button className={'flex-1'} disabled={!allowed.start} onClick={onButtonClick.bind(this, 'start')}>
                        <FontAwesomeIcon icon={faPlay} className={'mr-2'} />{vt("Démarrer")}</Button>
                </Can>
            )}
            <Can action={'control.restart'}>
                <Button.Text
                    className={'flex-1'}
                    disabled={!allowed.restart}
                    onClick={onButtonClick.bind(this, 'restart')}
                >
                    <FontAwesomeIcon icon={faRedoAlt} className={'mr-2'} />{vt("Redémarrer")}</Button.Text>
            </Can>
            {(!deck || (status && status !== 'offline')) && (
                <Can action={'control.stop'}>
                    <Button.Danger
                        className={'flex-1'}
                        disabled={killable ? !allowed.kill : !allowed.stop}
                        onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                    >
                        <FontAwesomeIcon icon={faStop} className={'mr-2'} />
                        {killable ? vt("Forcer l’arrêt") : vt("Arrêter")}
                    </Button.Danger>
                </Can>
            )}
        </div>
    );
};
