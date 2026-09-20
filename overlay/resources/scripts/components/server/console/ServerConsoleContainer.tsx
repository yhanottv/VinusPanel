import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import { Alert } from '@/components/elements/alert';
import styles from '@/components/server/console/style.module.css';

const ServerConsoleContainer = () => {
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    return (
        <ServerContentBlock title={'Console'}>
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? 'Le nœud de ce serveur est en maintenance : les actions sont temporairement indisponibles.'
                        : isInstalling
                        ? "L'installation du serveur est en cours : la plupart des actions sont indisponibles."
                        : 'Le serveur est transféré vers un autre nœud : les actions sont temporairement indisponibles.'}
                </Alert>
            )}
            <div className={styles.section_header}>
                <div>
                    <p className={styles.section_eyebrow}>TEMPS RÉEL</p>
                    <h2>Console et ressources</h2>
                </div>
                <p>Commandes, consommation et trafic de votre instance.</p>
            </div>
            <div className={'grid grid-cols-12 gap-4 mb-5'}>
                <div className={'flex col-span-12 xl:col-span-8'}>
                    <Spinner.Suspense>
                        <Console />
                    </Spinner.Suspense>
                </div>
                <ServerDetailsBlock className={'col-span-12 xl:col-span-4'} />
            </div>
            <div className={styles.metrics_heading}>
                <h2>Historique récent</h2>
                <p>Mise à jour automatique depuis le flux WebSocket.</p>
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
