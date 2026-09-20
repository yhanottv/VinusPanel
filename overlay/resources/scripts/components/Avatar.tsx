import React from 'react';
import BoringAvatar, { AvatarProps } from 'boring-avatars';
import { useStoreState } from '@/state/hooks';
import useProfileAppearance from '@/components/dashboard/profile/useProfileAppearance';

const palette = ['#ff7a1a', '#ffad66', '#f2c94c', '#43d6a3', '#475569'];
type Props = Omit<AvatarProps, 'colors'>;

const CustomAvatar = ({ source, size }: { source: string; size?: number | string }) => (
    <span
        style={{
            display: 'block',
            width: size || '100%',
            height: size || '100%',
            overflow: 'hidden',
            borderRadius: 'inherit',
        }}
    >
        <img src={source} alt={''} aria-hidden={'true'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </span>
);

const _Avatar = ({ variant = 'beam', name, size, ...props }: Props) => {
    const uuid = useStoreState((state) => state.user.data?.uuid);
    const { appearance } = useProfileAppearance(uuid);

    if (appearance.avatar && name === uuid) return <CustomAvatar source={appearance.avatar} size={size} />;
    return <BoringAvatar colors={palette} name={name} size={size} variant={variant} {...props} />;
};

const _UserAvatar = ({ variant = 'beam', size, ...props }: Omit<Props, 'name'>) => {
    const uuid = useStoreState((state) => state.user.data?.uuid);
    const { appearance } = useProfileAppearance(uuid);

    if (appearance.avatar) return <CustomAvatar source={appearance.avatar} size={size} />;
    return <BoringAvatar colors={palette} name={uuid || 'system'} size={size} variant={variant} {...props} />;
};

_Avatar.displayName = 'Avatar';
_UserAvatar.displayName = 'Avatar.User';

const Avatar = Object.assign(_Avatar, { User: _UserAvatar });
export default Avatar;
