import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import PowerButtons from '@/components/server/console/PowerButtons';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { Alert } from '@/components/elements/alert';
import styles from '@/components/server/console/style.module.css';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    const status = ServerContext.useStoreState((state) => state.status.value);

    const statusLabel =
        status === 'running'
            ? 'En ligne'
            : status === 'offline' || status === null
            ? 'Hors ligne'
            : status === 'starting'
            ? 'Démarrage'
            : status === 'stopping'
            ? 'Arrêt en cours'
            : 'Connexion…';
    const statusColor =
        status === 'running' ? '#43d6a3' : status === 'offline' || status === null ? '#fb7185' : '#fbbf24';

    return (
        <ServerContentBlock title={'Console'}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                        : isInstalling
                        ? 'This server is currently running its installation process and most actions are unavailable.'
                        : 'This server is currently being transferred to another node and all actions are unavailable.'}
                </Alert>
            )}
            <section
                className={styles.server_hero}
                style={{
                    backgroundImage:
                        "linear-gradient(90deg, rgba(8, 15, 23, 0.99) 0%, rgba(11, 22, 33, 0.93) 54%, rgba(8, 15, 23, 0.68) 100%), url('/assets/images/vinus/eagle.png')",
                }}
            >
                <div className={styles.hero_content}>
                    <div className={styles.hero_status}>
                        <span className={styles.hero_status_dot} style={{ backgroundColor: statusColor }} />
                        {statusLabel}
                    </div>
                    <h1>{name}</h1>
                    <p>{description || 'Instance gérée depuis votre centre de contrôle VinusPanel.'}</p>
                </div>
                <div className={styles.hero_actions}>
                    <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                        <PowerButtons className={'contents'} />
                    </Can>
                </div>
            </section>
            <div className={'grid grid-cols-12 gap-4 mb-5'}>
                <div className={'flex col-span-12 xl:col-span-8'}>
                    <Spinner.Suspense>
                        <Console />
                    </Spinner.Suspense>
                </div>
                <ServerDetailsBlock className={'col-span-12 xl:col-span-4'} />
            </div>
            <div className={'grid grid-cols-1 gap-4 md:grid-cols-3'}>
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>
            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
