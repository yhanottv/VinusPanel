import { vt } from '@/locales/translate';
import React, { memo } from 'react';
import { Link, useRouteMatch } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faCopy,
  faFolderOpen,

} from '@fortawesome/free-solid-svg-icons';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import CopyOnClick from '@/components/elements/CopyOnClick';
import Can from '@/components/elements/Can';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Features from '@feature/Features';
import Console from '@/components/server/console/Console';
import StatGraphs from '@/components/server/console/StatGraphs';
import ServerDetailsBlock from '@/components/server/console/ServerDetailsBlock';
import PowerButtons from '@/components/server/console/PowerButtons';
import { Alert } from '@/components/elements/alert';
import { ip } from '@/lib/formatters';
import styles from './workspace.module.css';

const ServerConsoleContainer = () => {
  const server = ServerContext.useStoreState((state) => state.server.data!);
  const status = ServerContext.useStoreState((state) => state.status.value);
  const connected = ServerContext.useStoreState((state) => state.socket.connected);
  const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
  const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);
  const { url } = useRouteMatch();
  const allocation = server.allocations.find((item) => item.isDefault);
  const address = allocation ? `${allocation.alias || ip(allocation.ip)}:${allocation.port}` : null;
  const state = !connected || !status ? 'unknown' : status;
  const labels = {
    unknown: vt("Connexion en cours"),
    running: vt("En ligne"),
    offline: vt("À l’arrêt"),
    starting: vt("Démarrage"),
    stopping: vt("Arrêt en cours"),
  };

  return (
    <PageContentBlock title={`${server.name} | Console`} className={styles.page}>
      <header className={styles.heading}>
        <Link to={'/'} className={styles.back}>
          <FontAwesomeIcon icon={faArrowLeft} />{vt(" Serveurs")}</Link>
        <div className={styles.heading_row}>
          <div className={styles.identity}>
            <p className={styles.eyebrow}>{vt("ESPACE SERVEUR ")}<span>/</span> CONSOLE
            </p>
            <h1>{server.name}</h1>
            {server.description && <p className={styles.description}>{server.description}</p>}
          </div>
          {address && (
            <CopyOnClick text={address}>
              <button type={'button'} className={styles.address} aria-label={vt('Copier l’adresse {{address}}', { address })}>
                <span>
                  <small>{vt("Adresse de connexion")}</small>
                  <strong>{address}</strong>
                </span>
                <FontAwesomeIcon icon={faCopy} />
              </button>
            </CopyOnClick>
          )}
        </div>
      </header>
      {(server.isNodeUnderMaintenance || isInstalling || server.isTransferring) && (
        <Alert type={'warning'} className={'mb-5'}>
          {server.isNodeUnderMaintenance
            ? vt("Le nœud est en maintenance. Les commandes sont temporairement indisponibles.")
            : isInstalling
            ? vt("Installation du serveur en cours.")
            : vt("Transfert du serveur en cours.")}
        </Alert>
      )}
      <section className={styles.graphs} aria-label={vt("Ressources du serveur")}>
        <Spinner.Suspense>
          <StatGraphs />
        </Spinner.Suspense>
      </section>
      <div className={styles.workspace}>
        <aside className={styles.controls} aria-label={vt("Pilotage du serveur")}>
          <section className={styles.power_panel} data-state={state}>
            <div className={styles.panel_label}>
              <h2>{vt("État du serveur")}</h2>
            </div>
            <div className={styles.server_state}>
              <span className={styles.status_dot} aria-hidden={'true'} />
              <div>
                <p aria-live={'polite'}>{labels[state]}</p>
              </div>
            </div>
            <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
              <PowerButtons variant={'deck'} status={status} connected={connected} className={styles.power_controls} />
            </Can>
            <div className={styles.node}>
              <span>{vt("Hébergé sur")}</span>
              <strong>{server.node}</strong>
            </div>
          </section>
          <ServerDetailsBlock className={styles.telemetry} />
        </aside>
        <section className={styles.terminal_column} aria-label={vt("Espace terminal")}>
          <div className={styles.workspace_bar}>
            <h2>
              Console
            </h2>
            <span className={styles.terminal_connection} data-connected={connected}>{connected ? vt("Connectée") : vt("Connexion…")}</span>
                        <Can action={'file.read'}>
              <Link to={`${url.replace(/\/$/, '')}/files`}>
                <FontAwesomeIcon icon={faFolderOpen} />{vt(" Fichiers")}</Link>
            </Can>
          </div>
          <Spinner.Suspense>
            <Console />
          </Spinner.Suspense>
        </section>
      </div>

      <Features enabled={eggFeatures} />
    </PageContentBlock>
  );
};
export default memo(ServerConsoleContainer, isEqual);
