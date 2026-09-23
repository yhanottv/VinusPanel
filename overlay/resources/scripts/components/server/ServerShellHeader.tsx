import { useDesign } from '@/designRuntime';
import PrivateValue from '@/components/elements/PrivateValue';
import React from 'react';
import { ServerContext } from '@/state/server';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Can from '@/components/elements/Can';
import PowerButtons from '@/components/server/console/PowerButtons';
import SoftwareIcon from './SoftwareIcon';
import { ip } from '@/lib/formatters';
import { serverDesign } from '@/vinusDesign';
import { vt } from '@/locales/translate';
import styles from './server.module.css';
export default () => {
    const design = useDesign();
    const server = ServerContext.useStoreState(s => s.server.data!);
    const status = ServerContext.useStoreState(s => s.status.value);
    const connected = ServerContext.useStoreState(s => s.socket.connected);
    const allocation = server.allocations.find(a => a.isDefault);
    const appearance = design.servers[server.uuid] || {};
    const address = allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : '';
    const label = !connected || !status ? vt('Connexion…') : status === 'running' ? vt('En ligne') : status === 'starting' ? vt('Démarrage') : status === 'stopping' ? vt('Arrêt en cours') : vt('Hors ligne');
    return <header className={styles.header} style={appearance.banner ? { backgroundImage: `linear-gradient(90deg, rgba(9,12,17,.90), rgba(9,12,17,.70)), url(${JSON.stringify(appearance.banner)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
        <SoftwareIcon software={server.softwareProfile?.software} size={44} />
        <div className={styles.headerIdentity}><div className={styles.titleLine}><h1>{server.name}</h1><span className={styles.badge} data-state={connected ? status : 'unknown'}>{label}</span></div><div className={styles.headerMeta}><span>{server.node}</span>
            {address && <CopyOnClick text={address}><button type="button" title={vt('Copier l’adresse')}><span className={styles.addressPill}>IP <PrivateValue>{allocation?.alias || (allocation ? ip(allocation.ip) : '')}</PrivateValue></span> <span className={styles.addressPill}>PORT <PrivateValue>{allocation?.port}</PrivateValue></span> ⧉</button></CopyOnClick>}
        </div></div>
        <Can action={['control.start', 'control.stop', 'control.restart']} matchAny><PowerButtons className={styles.power} status={status} connected={connected} /></Can>
    </header>;
};
