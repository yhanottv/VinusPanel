import React, { useEffect, useState } from 'react';
import Icon from '@/components/dashboard/DashboardIcon';

const icons: Record<string, string> = {
    velocity: 'velocity.svg', youer: 'youer.png', forge: 'forge-mark.svg', neoforge: 'neoforge.svg', fabric: 'fabric.png', spigot: 'spigot.png', paper: 'paper-mark.svg',
};
export const softwareName = (software?: string | null) => software
    ? ({ neoforge: 'NeoForge', bungeecord: 'BungeeCord', youer: 'Youer', spigot: 'Spigot', fabric: 'Fabric', forge: 'Forge', paper: 'Paper', velocity: 'Velocity' }[software] || software.charAt(0).toUpperCase() + software.slice(1))
    : 'Serveur';

export default function SoftwareIcon({ software, size = 32 }: { software?: string | null; size?: number }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [software]);
    const source = software && icons[software];
    const label = softwareName(software);
    return <span title={label} style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
        {source && !failed ? <img src={`/assets/vinus/software/${source}`} alt={label} width={size} height={size} style={{ objectFit: 'contain', width: size, height: size }} onError={() => setFailed(true)} />
            : software ? <span role="img" aria-label={label} style={{ fontSize: size * .4, fontWeight: 750, color: 'var(--dash-accent, #49a6e9)' }}>{label.slice(0, 2).toUpperCase()}</span>
                : <Icon name="server" />}
    </span>;
}
