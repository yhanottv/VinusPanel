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
                    <p className={styles.section_eyebrow}>SUPERVISION EN TEMPS RÉEL</p>
                    <h2>Vue d’ensemble</h2>
                </div>
                <p>État, ressources et trafic de votre instance.</p>
            </div>
            <div className={'mb-6'}>
                <ServerDetailsBlock />
            </div>
            <div className={styles.metrics_heading}>
                <h2>Tendances</h2>
                <p>Historique court mis à jour automatiquement.</p>
            </div>
            <div className={'mb-7 grid grid-cols-1 gap-4 md:grid-cols-3'}>
                <Spinner.Suspense>
                    <StatGraphs />
                </Spinner.Suspense>
            </div>
            <div className={styles.metrics_heading}>
                <h2>Console</h2>
                <p>Sortie en direct et commandes administrateur.</p>
            </div>
            <Spinner.Suspense>
                <Console />
            </Spinner.Suspense>
            <Features enabled={eggFeatures} />
        </ServerContentBlock>
    );
};

export default memo(ServerConsoleContainer, isEqual);
