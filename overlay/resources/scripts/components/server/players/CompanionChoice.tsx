import React from 'react';
import { vt } from '@/locales/translate';
import styles from './companion-choice.module.css';

export type CompanionOffer = { supported: boolean; can_install: boolean; kind: string | null; read_only: boolean };
export type CompanionDecision = 'yes' | 'no' | null;
export const decisionReady = (offer: CompanionOffer, decision: CompanionDecision) => !offer?.supported || !offer.can_install || decision !== null;
export const acceptsCompanion = (offer: CompanionOffer, decision: CompanionDecision) => !!offer?.supported && offer.can_install && decision === 'yes';

export function companionResult(status: string): string {
    switch (status) {
        case 'installed': return vt('Liaison Joueurs installée. Démarrez le serveur pour afficher les données en direct.');
        case 'existing': return vt('Une liaison Joueurs est déjà présente et a été conservée. Vérifiez sa compatibilité avant de démarrer.');
        case 'failed': return vt('Le serveur est installé, mais la liaison Joueurs n’a pas pu être ajoutée. Réessayez depuis la catégorie Joueurs, serveur arrêté.');
        case 'unsupported': return vt('Le serveur est installé. Aucune liaison Joueurs vérifiée n’est disponible pour cette configuration.');
        default: return vt('Aucune liaison Joueurs n’a été ajoutée. La catégorie Joueurs reste accessible pour consulter les données sauvegardées ou installer la liaison plus tard.');
    }
}

export default function CompanionChoice({ offer, value, onChange, disabled }: { offer: CompanionOffer; value: CompanionDecision; onChange: (value: CompanionDecision) => void; disabled: boolean }) {
    return <fieldset className={styles.choice} disabled={disabled}>
        <legend>{vt('Informations sur les joueurs')}</legend>
        <p>{vt('La liaison VinusPlayers transmet au panel les joueurs connectés, leur inventaire, leur vie, leur nourriture et leur expérience en direct.')}</p>
        {offer?.supported && <p>{vt(offer.read_only ? 'Cette version utilise un mod serveur en lecture seule. Les joueurs n’ont rien à installer sur leur ordinateur.' : 'Cette version utilise un plugin serveur. Il permet aussi les actions autorisées : soigner, nourrir, gérer les accès et modifier les niveaux.')}</p>}
        {offer?.supported && offer.can_install ? <>
            <p className={styles.question}>{vt(offer.kind === 'plugin' ? 'Voulez-vous installer le plugin VinusPlayers ?' : 'Voulez-vous installer le mod VinusPlayers ?')}</p>
            <div className={styles.options}>
                <label data-selected={value === 'yes'}><input type="radio" name="install-players" checked={value === 'yes'} onChange={() => onChange('yes')}/><span><strong>{vt('Oui, installer la liaison')}</strong><small>{vt('Activer les informations en direct après le démarrage du serveur.')}</small></span></label>
                <label data-selected={value === 'no'}><input type="radio" name="install-players" checked={value === 'no'} onChange={() => onChange('no')}/><span><strong>{vt('Non, continuer sans la liaison')}</strong><small>{vt('La catégorie Joueurs reste disponible. Vous pourrez installer la liaison plus tard.')}</small></span></label>
            </div>
            {value === null && <small>{vt('Choisissez Oui ou Non pour poursuivre l’installation.')}</small>}
        </> : <p className={styles.question}>{vt(!offer?.supported ? 'Aucune liaison vérifiée pour cette configuration. Le serveur peut être installé sans liaison ; la catégorie Joueurs reste disponible.' : 'Vous n’avez pas la permission d’installer la liaison. Le serveur peut être installé sans elle.')}</p>}
        <small>{vt('Aucune liaison déjà présente ne sera supprimée ou remplacée.')}</small>
    </fieldset>;
}
