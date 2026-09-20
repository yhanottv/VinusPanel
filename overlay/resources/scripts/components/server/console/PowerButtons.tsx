import React, { useEffect, useState } from 'react';
import { Button } from '@/components/elements/button/index';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { Dialog } from '@/components/elements/dialog';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faRedoAlt, faStop } from '@fortawesome/free-solid-svg-icons';

interface PowerButtonProps {
    className?: string;
}

type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

export default ({ className }: PowerButtonProps) => {
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
        e.preventDefault();
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') {
            setOpen(false);
        }
    }, [status]);

    return (
        <div className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={'Forcer l’arrêt du serveur'}
                confirm={'Continuer'}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                Un arrêt forcé peut endommager les données en cours d’écriture.
            </Dialog.Confirm>
            <Can action={'control.start'}>
                <Button
                    className={'flex-1'}
                    disabled={status !== 'offline'}
                    onClick={onButtonClick.bind(this, 'start')}
                >
                    <FontAwesomeIcon icon={faPlay} className={'mr-2'} />
                    Démarrer
                </Button>
            </Can>
            <Can action={'control.restart'}>
                <Button.Text className={'flex-1'} disabled={!status} onClick={onButtonClick.bind(this, 'restart')}>
                    <FontAwesomeIcon icon={faRedoAlt} className={'mr-2'} />
                    Redémarrer
                </Button.Text>
            </Can>
            <Can action={'control.stop'}>
                <Button.Danger
                    className={'flex-1'}
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                >
                    <FontAwesomeIcon icon={faStop} className={'mr-2'} />
                    {killable ? 'Forcer' : 'Arrêter'}
                </Button.Danger>
            </Can>
        </div>
    );
};
