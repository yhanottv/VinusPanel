import React, { useEffect, useState } from 'react';
import Icon from '@/components/dashboard/DashboardIcon';

const icons: Record<string, string> = {
    "vanilla": "catalog-vanilla.png",
    "paper": "catalog-paper.png",
    "fabric": "catalog-fabric.png",
    "forge": "catalog-forge.png",
    "neoforge": "catalog-neoforge.png",
    "velocity": "catalog-velocity.png",
    "purpur": "catalog-purpur.png",
    "pufferfish": "catalog-pufferfish.png",
    "folia": "catalog-folia.png",
    "sponge": "catalog-sponge.png",
    "spigot": "catalog-spigot.png",
    "bungeecord": "catalog-bungeecord.png",
    "waterfall": "catalog-waterfall.png",
    "quilt": "catalog-quilt.png",
    "velocity_ctd": "catalog-velocity_ctd.png",
    "canvas": "catalog-canvas.png",
    "arclight": "catalog-arclight.png",
    "mohist": "catalog-mohist.png",
    "youer": "catalog-youer.png",
    "magma": "catalog-magma.png",
    "divinemc": "catalog-divinemc.png",
    "leaf": "catalog-leaf.png",
    "leaves": "catalog-leaves.png",
    "aspaper": "catalog-aspaper.png",
    "legacyfabric": "catalog-legacyfabric.png",
    "pluto": "catalog-pluto.png",
    "loohplimbo": "catalog-loohplimbo.png",
    "nanolimbo": "catalog-nanolimbo.png"
};
const names: Record<string, string> = {
    "vanilla": "Vanilla",
    "paper": "Paper",
    "fabric": "Fabric",
    "forge": "Forge",
    "neoforge": "NeoForge",
    "velocity": "Velocity",
    "purpur": "Purpur",
    "pufferfish": "Pufferfish",
    "folia": "Folia",
    "sponge": "Sponge",
    "spigot": "Spigot",
    "bungeecord": "BungeeCord",
    "waterfall": "Waterfall",
    "quilt": "Quilt",
    "velocity_ctd": "Velocity-CTD",
    "canvas": "Canvas",
    "arclight": "Arclight",
    "mohist": "Mohist",
    "youer": "Youer",
    "magma": "Magma",
    "divinemc": "DivineMC",
    "leaf": "Leaf",
    "leaves": "Leaves",
    "aspaper": "ASPaper",
    "legacyfabric": "Legacy Fabric",
    "pluto": "Pluto",
    "loohplimbo": "LooHP Limbo",
    "nanolimbo": "NanoLimbo",
    "arclight-forge": "Arclight (Forge)",
    "arclight-fabric": "Arclight (Fabric)",
    "arclight-neoforge": "Arclight (NeoForge)"
};
export const softwareName = (software?: string | null) => software ? names[software] || software.charAt(0).toUpperCase() + software.slice(1) : 'Serveur';

export default function SoftwareIcon({ software, size = 32 }: { software?: string | null; size?: number }) {
    const [failed, setFailed] = useState(false);
    useEffect(() => setFailed(false), [software]);
    const source = software && (icons[software] || (software.startsWith('arclight-') ? icons.arclight : undefined));
    const label = softwareName(software);
    return <span title={label} style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}>
        {source && !failed ? <img src={`/assets/vinus/software/${source}`} alt={label} width={size} height={size} style={{ objectFit: 'contain', width: size, height: size }} onError={() => setFailed(true)} />
            : software ? <span role="img" aria-label={label} style={{ fontSize: size * .4, fontWeight: 750, color: 'var(--dash-accent, #ff9b52)' }}>{label.slice(0, 2).toUpperCase()}</span>
                : <Icon name="server" />}
    </span>;
}
