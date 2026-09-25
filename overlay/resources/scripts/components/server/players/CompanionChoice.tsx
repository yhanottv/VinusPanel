import React, { useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faServer, faUsers, faHeart, faBoxOpen, faStar, faCheck, faSyncAlt, faShieldAlt, faArrowRight, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import MessageBox from '@/components/MessageBox';
import { vt } from '@/locales/translate';
import { CompanionStage } from './companionFollowup';
import styles from './companion-choice.module.css';

export type CompanionOffer = { supported: boolean; can_install: boolean; kind: string | null; read_only: boolean; software?: string; minecraft?: string };
const stages: Record<string, string> = { checking: 'Vérification du serveur…', stopping: 'Arrêt normal du serveur…', installing: 'Installation de VinusPlayers…', starting: 'Démarrage du serveur…', done: 'Démarrage demandé.' };
export default function CompanionChoice({ open, offer, canPower, stage, error, result, onClose, onInstall, serverId }: {
    open: boolean; offer: CompanionOffer | null; canPower: boolean; stage: CompanionStage; error: string; result: string; onClose: () => void; onInstall: () => void; serverId: string;
}) {
    const busy = !!stage;
    const title = useRef<HTMLHeadingElement>(null);
    const reduced = useReducedMotion();
    return <AnimatePresence>{open && <Dialog as={motion.div} open initialFocus={title} onClose={() => { if (!busy) onClose(); }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .18 }}>
        <div className={styles.overlay} aria-hidden="true"/>
        <div className={styles.position}><Dialog.Panel as={motion.div} className={styles.panel} initial={{ scale: reduced ? 1 : .97 }} animate={{ scale: 1 }} transition={{ duration: reduced ? 0 : .24, ease: 'easeOut' }}>
        <header className={styles.heading}><Dialog.Title ref={title} tabIndex={-1}>{vt(result ? 'Liaison Joueurs' : 'Votre serveur est prêt. Et vos joueurs ?')}</Dialog.Title>{!busy && <button type="button" onClick={onClose} aria-label={vt('Fermer')}><FontAwesomeIcon icon={faTimes}/></button>}</header>
        <div className={styles.choice}>
            <div className={styles.connection} aria-hidden="true"><span><FontAwesomeIcon icon={faServer}/></span><i/><span className={styles.playerMark}><FontAwesomeIcon icon={result === 'installed' ? faCheck : faUsers}/></span></div>
            {result ? <>
                <h3>{vt(result === 'installed' ? 'VinusPlayers est installé' : 'Une liaison est déjà présente')}</h3>
                <p>{vt(result === 'installed' ? 'Le démarrage a été demandé. Les informations apparaîtront dans Joueurs lorsque Minecraft et la liaison seront prêts.' : 'Le fichier existant a été conservé. Vérifiez sa compatibilité dans les fichiers et la console avant de démarrer le serveur.')}</p>
                <div className={styles.actions}><button onClick={onClose}>{vt('Fermer')}</button><Link className={styles.primary} onClick={onClose} to={`/server/${serverId}/players`}>{vt('Voir les joueurs')} <FontAwesomeIcon icon={faArrowRight}/></Link></div>
            </> : <>
                <p>{vt('Ajoutez VinusPlayers pour retrouver les informations de vos joueurs directement dans le panel.')}</p>
                <ul className={styles.features}>
                    <li><FontAwesomeIcon icon={faBoxOpen}/><span><strong>{vt('Inventaire et équipement')}</strong><small>{vt('Consultez les objets et le coffre de l’Ender.')}</small></span></li>
                    <li><FontAwesomeIcon icon={faHeart}/><span><strong>{vt('Vie et nourriture')}</strong><small>{vt('Suivez l’état du joueur en direct.')}</small></span></li>
                    <li><FontAwesomeIcon icon={faStar}/><span><strong>{vt('Niveaux et expérience')}</strong><small>{vt('Retrouvez son XP, son skin et sa présence.')}</small></span></li>
                </ul>
                {offer ? <>
                    <div className={styles.compatibility}><FontAwesomeIcon icon={faShieldAlt}/><span>{offer.software} {offer.minecraft} · {vt(offer.supported ? (offer.kind === 'plugin' ? 'Plugin compatible' : 'Mod compatible') : 'Aucune liaison vérifiée pour cette configuration')}</span></div>
                    {offer.supported && <p>{vt(offer.read_only ? 'Le mod fonctionne uniquement sur le serveur. Les joueurs n’ont rien à installer. L’inventaire et les informations restent en lecture seule.' : 'Le plugin permet aussi les actions autorisées : soigner, nourrir, gérer les accès et modifier les niveaux. L’inventaire reste en lecture seule.')}</p>}
                    {offer.supported && offer.can_install && canPower ? <div className={styles.restart}><FontAwesomeIcon icon={faSyncAlt}/><span>{vt('L’activation arrêtera normalement le serveur, installera la liaison puis le redémarrera. Les joueurs seront brièvement déconnectés.')}</span></div> : <p>{vt(offer.supported ? 'Un administrateur disposant des permissions de fichiers, de console et de démarrage/arrêt doit installer la liaison.' : 'Cette version peut être utilisée sans liaison. Consultez les combinaisons vérifiées depuis Joueurs.')}</p>}
                </> : !error && <p role="status">{vt('Vérification de la compatibilité…')}</p>}
                {error && <><MessageBox type="error">{error}</MessageBox><p>{vt('Si le serveur est arrêté, contrôlez la console avant de le redémarrer. Vous pouvez réessayer depuis Joueurs.')}</p></>}
                {busy && <div role="status" className={styles.progress}><FontAwesomeIcon icon={faSyncAlt}/>{vt(stages[stage])}</div>}
                <div className={styles.actions}><button type="button" disabled={busy} onClick={onClose}>{vt('Plus tard')}</button>{offer?.supported && offer.can_install && canPower && <button type="button" className={styles.primary} disabled={busy} onClick={onInstall}><FontAwesomeIcon icon={faUsers}/>{vt(busy ? 'Activation en cours…' : 'Arrêter, installer et redémarrer')}</button>}</div>
                <p className={styles.footnote}>{vt('Facultatif. Sans liaison, Joueurs reste accessible avec les données sauvegardées disponibles. Vous pourrez l’installer plus tard. Aucun fichier existant n’est remplacé.')}</p>
            </>}
        </div>
    </Dialog.Panel></div></Dialog>}</AnimatePresence>;
}
