import axios, { AxiosProgressEvent } from 'axios';
import getFileUploadUrl from '@/api/server/files/getFileUploadUrl';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import React, { useEffect, useRef } from 'react';
import { ModalMask } from '@/components/elements/Modal';
import Fade from '@/components/elements/Fade';
import useEventListener from '@/plugins/useEventListener';
import { useFlashKey } from '@/plugins/useFlash';
import useFileManagerSWR from '@/plugins/useFileManagerSwr';
import { ServerContext } from '@/state/server';
import { WithClassname } from '@/components/types';
import Portal from '@/components/elements/Portal';
import { CloudUploadIcon } from '@heroicons/react/outline';
import { useSignal } from '@preact/signals-react';

function isFileOrDirectory(event: DragEvent): boolean {
    return !!event.dataTransfer?.types?.some((value) => value.toLowerCase() === 'files');
}

export default ({ className }: WithClassname) => {
    const fileUploadInput = useRef<HTMLInputElement>(null);
    const visible = useSignal(false);
    const timeouts = useSignal<NodeJS.Timeout[]>([]);
    const { mutate } = useFileManagerSWR();
    const { addError, clearAndAddHttpError } = useFlashKey('files');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const { clearFileUploads, removeFileUpload, pushFileUpload, setUploadProgress } = ServerContext.useStoreActions(
        (actions) => actions.files
    );

    useEventListener(
        'dragenter',
        (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (isFileOrDirectory(event)) visible.value = true;
        },
        { capture: true }
    );
    useEventListener('dragexit', () => (visible.value = false), { capture: true });
    useEventListener('keydown', () => (visible.value = false));
    useEffect(() => () => timeouts.value.forEach(clearTimeout), []);

    const onUploadProgress = (data: AxiosProgressEvent, name: string) => {
        setUploadProgress({ name, loaded: data.loaded });
    };

    const onFileSubmission = (files: FileList) => {
        clearAndAddHttpError();
        const list = Array.from(files);
        if (list.some((file) => !file.type && (!file.size || file.size === 4096))) {
            return addError("L'importation de dossiers n'est pas prise en charge.", 'Erreur');
        }

        const uploads = list.map((file) => {
            const controller = new AbortController();
            pushFileUpload({ name: file.name, data: { abort: controller, loaded: 0, total: file.size } });
            return () =>
                getFileUploadUrl(uuid).then((url) =>
                    axios
                        .post(
                            url,
                            { files: file },
                            {
                                signal: controller.signal,
                                headers: { 'Content-Type': 'multipart/form-data' },
                                params: { directory },
                                onUploadProgress: (data) => onUploadProgress(data, file.name),
                            }
                        )
                        .then(() => timeouts.value.push(setTimeout(() => removeFileUpload(file.name), 500)))
                );
        });

        Promise.all(uploads.map((upload) => upload()))
            .then(() => mutate())
            .catch((error) => {
                clearFileUploads();
                clearAndAddHttpError(error);
            });
    };

    return (
        <>
            <Portal>
                <Fade appear in={visible.value} timeout={75} key={'upload_modal_mask'} unmountOnExit>
                    <ModalMask
                        onClick={() => (visible.value = false)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            visible.value = false;
                            if (event.dataTransfer?.files.length) onFileSubmission(event.dataTransfer.files);
                        }}
                    >
                        <div className={'pointer-events-none flex w-full items-center justify-center'}>
                            <div
                                className={
                                    'mx-10 flex w-full max-w-sm items-center space-x-4 rounded-xl bg-black p-6 ring-4 ring-primary-300 ring-opacity-50'
                                }
                            >
                                <CloudUploadIcon className={'h-10 w-10 flex-shrink-0 text-primary-300'} />
                                <p className={'flex-1 text-center font-header text-lg text-neutral-100'}>
                                    Déposez vos fichiers ici pour les importer.
                                </p>
                            </div>
                        </div>
                    </ModalMask>
                </Fade>
            </Portal>
            <input
                type={'file'}
                ref={fileUploadInput}
                css={tw`hidden`}
                onChange={(event) => {
                    if (!event.currentTarget.files) return;
                    onFileSubmission(event.currentTarget.files);
                    if (fileUploadInput.current) fileUploadInput.current.files = null;
                }}
                multiple
            />
            <Button className={className} onClick={() => fileUploadInput.current?.click()}>
                Importer
            </Button>
        </>
    );
};
