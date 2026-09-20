import { useCallback, useEffect, useState } from 'react';

export interface ProfileAppearance {
    displayName: string;
    avatar: string;
}

export const PROFILE_UPDATED_EVENT = 'vinus:profile-updated';

const emptyAppearance: ProfileAppearance = { displayName: '', avatar: '' };
const storageKey = (uuid: string) => `${uuid}:vinus-profile-v1`;

export const readProfileAppearance = (uuid?: string): ProfileAppearance => {
    if (!uuid || typeof window === 'undefined') return emptyAppearance;

    try {
        const value = JSON.parse(window.localStorage.getItem(storageKey(uuid)) || '{}');
        return {
            displayName: typeof value.displayName === 'string' ? value.displayName.slice(0, 32) : '',
            avatar: typeof value.avatar === 'string' && value.avatar.startsWith('data:image/') ? value.avatar : '',
        };
    } catch {
        return emptyAppearance;
    }
};

export const saveProfileAppearance = (uuid: string, appearance: ProfileAppearance) => {
    const normalized = {
        displayName: appearance.displayName.trim().slice(0, 32),
        avatar: appearance.avatar,
    };
    window.localStorage.setItem(storageKey(uuid), JSON.stringify(normalized));
    window.dispatchEvent(new CustomEvent(PROFILE_UPDATED_EVENT, { detail: { uuid, appearance: normalized } }));
    return normalized;
};

export default (uuid?: string) => {
    const [appearance, setAppearance] = useState<ProfileAppearance>(() => readProfileAppearance(uuid));

    useEffect(() => {
        setAppearance(readProfileAppearance(uuid));
        const onUpdate = (event: Event) => {
            const detail = (event as CustomEvent<{ uuid: string; appearance: ProfileAppearance }>).detail;
            if (detail?.uuid === uuid) setAppearance(detail.appearance);
        };
        const onStorage = () => setAppearance(readProfileAppearance(uuid));
        window.addEventListener(PROFILE_UPDATED_EVENT, onUpdate);
        window.addEventListener('storage', onStorage);
        return () => {
            window.removeEventListener(PROFILE_UPDATED_EVENT, onUpdate);
            window.removeEventListener('storage', onStorage);
        };
    }, [uuid]);

    const update = useCallback(
        (value: ProfileAppearance) => {
            if (!uuid) return;
            setAppearance(saveProfileAppearance(uuid, value));
        },
        [uuid]
    );

    return { appearance, update };
};
