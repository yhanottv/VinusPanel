import React, { useState } from 'react';
import { ClipboardListIcon } from '@heroicons/react/outline';
import { Dialog } from '@/components/elements/dialog';
import { Button } from '@/components/elements/button/index';
import style from './style.module.css';

export default ({ meta }: { meta: Record<string, unknown> }) => {
    const [open, setOpen] = useState(false);
    return (
        <>
            <Dialog open={open} onClose={() => setOpen(false)} hideCloseIcon title={'Détails de l’événement'}>
                <pre
                    className={
                        'overflow-x-auto whitespace-pre-wrap rounded-lg bg-neutral-900 p-3 font-mono text-xs leading-relaxed'
                    }
                >
                    {JSON.stringify(meta, null, 2)}
                </pre>
                <Dialog.Footer>
                    <Button.Text onClick={() => setOpen(false)}>Fermer</Button.Text>
                </Dialog.Footer>
            </Dialog>
            <button className={style.meta_button} onClick={() => setOpen(true)} aria-label={'Voir les détails'}>
                <ClipboardListIcon className={'h-5 w-5'} />
            </button>
        </>
    );
};
