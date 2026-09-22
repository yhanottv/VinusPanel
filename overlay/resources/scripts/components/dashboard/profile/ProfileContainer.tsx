import React, { useEffect, useRef, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Avatar from '@/components/Avatar';
import Input from '@/components/elements/Input';
import { Button } from '@/components/elements/button/index';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera, faCheck, faInfoCircle, faPalette, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import useProfileAppearance, { ProfileAppearance } from './useProfileAppearance';

const Header = styled.header`
    ${tw`mb-7 border-b pb-6`};
    border-color: rgba(255, 255, 255, 0.07);
    h1 {
        ${tw`text-3xl font-semibold text-neutral-50`};
    }
    p {
        ${tw`mt-2 max-w-2xl text-sm text-neutral-400`};
    }
`;

const ProfileLayout = styled.div`
    ${tw`grid grid-cols-1 gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]`};
`;

const Preview = styled.section`
    ${tw`relative overflow-hidden rounded-2xl border p-6`};
    min-height: 25rem;
    background: var(--vinus-glass);
    border-color: rgba(255, 255, 255, 0.08);

    &::after {
        content: '';
        ${tw`pointer-events-none absolute -bottom-16 -right-16 h-52 w-52 rounded-full`};
        border: 1px solid rgba(var(--vinus-accent-rgb), 0.14);
    }
`;

const AvatarFrame = styled.div`
    ${tw`relative mx-auto mt-8 h-36 w-36 overflow-hidden rounded-[2rem] border`};
    background: rgba(0, 0, 0, 0.28);
    border-color: rgba(var(--vinus-accent-rgb), 0.26);
    box-shadow: var(--vinus-glass-shadow);
`;

const Editor = styled.section`
    ${tw`rounded-2xl border p-5 sm:p-7`};
    background: var(--vinus-glass);
    border-color: rgba(255, 255, 255, 0.08);

    .upload-zone {
        ${tw`mt-3 flex flex-col gap-3 rounded-xl border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between`};
        border-color: rgba(255, 255, 255, 0.13);
        background: rgba(255, 255, 255, 0.02);
    }
`;

const resizeImage = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Impossible de lire cette image.'));
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => reject(new Error('Format d’image non pris en charge.'));
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const size = 320;
                const sourceSize = Math.min(image.width, image.height);
                canvas.width = size;
                canvas.height = size;
                const context = canvas.getContext('2d');
                if (!context) return reject(new Error('Impossible de préparer cette image.'));
                context.drawImage(
                    image,
                    (image.width - sourceSize) / 2,
                    (image.height - sourceSize) / 2,
                    sourceSize,
                    sourceSize,
                    0,
                    0,
                    size,
                    size
                );
                resolve(canvas.toDataURL('image/jpeg', 0.86));
            };
            image.src = String(reader.result);
        };
        reader.readAsDataURL(file);
    });

export default () => {
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const { appearance, update } = useProfileAppearance(user.uuid);
    const [draft, setDraft] = useState<ProfileAppearance>(appearance);
    const [message, setMessage] = useState('');
    const fileInput = useRef<HTMLInputElement>(null);

    useEffect(() => setDraft(appearance), [appearance.displayName, appearance.avatar]);

    const selectImage = async (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return setMessage('Sélectionnez un fichier image valide.');
        if (file.size > 6 * 1024 * 1024) return setMessage('L’image doit faire moins de 6 Mo.');
        try {
            const avatar = await resizeImage(file);
            setDraft((current) => ({ ...current, avatar }));
            setMessage('');
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'Impossible de traiter cette image.');
        }
    };

    const save = () => {
        update(draft);
        setMessage('Profil visuel enregistré sur cet appareil.');
    };

    return (
        <PageContentBlock title={'Profil | VinusPanel'}>
            <Header>
                <p css={tw`mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-300`}>
                    Personnalisation
                </p>
                <h1>Votre profil</h1>
                <p>
                    Choisissez le nom et la photo affichés dans VinusPanel sans modifier votre identifiant de connexion.
                </p>
            </Header>
            <ProfileLayout>
                <Preview>
                    <p css={tw`text-xs font-semibold uppercase tracking-[0.17em] text-neutral-500`}>Aperçu</p>
                    <AvatarFrame>
                        {draft.avatar ? (
                            <img src={draft.avatar} alt={'Aperçu du profil'} css={tw`h-full w-full object-cover`} />
                        ) : (
                            <Avatar.User size={144} />
                        )}
                    </AvatarFrame>
                    <div css={tw`relative z-10 mt-5 text-center`}>
                        <h2 css={tw`text-xl font-semibold text-neutral-50`}>{draft.displayName || user.username}</h2>
                        <p css={tw`mt-1 text-sm text-neutral-500`}>{user.email}</p>
                        <span
                            css={tw`mt-4 inline-flex items-center rounded-full border border-green-400 border-opacity-20 bg-green-400 bg-opacity-5 px-3 py-1 text-xs font-medium text-green-400`}
                        >
                            <span css={tw`mr-2 h-1.5 w-1.5 rounded-full bg-green-400`} /> Profil actif
                        </span>
                    </div>
                </Preview>
                <Editor>
                    <div css={tw`flex items-center`}>
                        <span
                            css={tw`mr-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 bg-opacity-10 text-primary-300`}
                        >
                            <FontAwesomeIcon icon={faPalette} />
                        </span>
                        <div>
                            <h2 css={tw`text-lg font-semibold text-neutral-100`}>Identité visuelle</h2>
                            <p css={tw`mt-0.5 text-xs text-neutral-500`}>
                                Ces réglages restent privés dans votre navigateur.
                            </p>
                        </div>
                    </div>
                    <div css={tw`mt-7`}>
                        <label htmlFor={'display-name'} css={tw`mb-2 block text-sm font-semibold text-neutral-200`}>
                            Nom affiché
                        </label>
                        <Input
                            id={'display-name'}
                            maxLength={32}
                            value={draft.displayName}
                            placeholder={user.username}
                            onChange={(event) =>
                                setDraft((current) => ({ ...current, displayName: event.target.value }))
                            }
                        />
                        <p css={tw`mt-2 text-xs text-neutral-500`}>
                            Votre nom d’utilisateur réel reste « {user.username} ».
                        </p>
                    </div>
                    <div css={tw`mt-7`}>
                        <p css={tw`text-sm font-semibold text-neutral-200`}>Photo de profil</p>
                        <div className={'upload-zone'}>
                            <div>
                                <p css={tw`text-sm text-neutral-300`}>PNG, JPG ou WebP</p>
                                <p css={tw`mt-1 text-xs text-neutral-500`}>
                                    Recadrage carré automatique, 6 Mo maximum.
                                </p>
                            </div>
                            <Button.Text onClick={() => fileInput.current?.click()}>
                                <FontAwesomeIcon icon={faCamera} css={tw`mr-2`} /> Choisir une image
                            </Button.Text>
                            <input
                                ref={fileInput}
                                type={'file'}
                                accept={'image/png,image/jpeg,image/webp'}
                                css={tw`hidden`}
                                onChange={(event) => selectImage(event.target.files?.[0])}
                            />
                        </div>
                    </div>
                    {message && (
                        <p
                            css={tw`mt-4 flex items-center rounded-lg border border-primary-400 border-opacity-20 bg-primary-500 bg-opacity-5 px-3 py-2 text-xs text-primary-200`}
                        >
                            <FontAwesomeIcon icon={faInfoCircle} css={tw`mr-2`} /> {message}
                        </p>
                    )}
                    <div
                        css={tw`mt-7 flex flex-col gap-2 border-t border-neutral-700 pt-5 sm:flex-row sm:justify-between`}
                    >
                        <Button.Text
                            onClick={() => {
                                const reset = { displayName: '', avatar: '' };
                                setDraft(reset);
                                update(reset);
                                setMessage('Personnalisation supprimée.');
                            }}
                        >
                            <FontAwesomeIcon icon={faTrashAlt} css={tw`mr-2`} /> Réinitialiser
                        </Button.Text>
                        <Button onClick={save}>
                            <FontAwesomeIcon icon={faCheck} css={tw`mr-2`} /> Enregistrer le profil
                        </Button>
                    </div>
                </Editor>
            </ProfileLayout>
        </PageContentBlock>
    );
};
