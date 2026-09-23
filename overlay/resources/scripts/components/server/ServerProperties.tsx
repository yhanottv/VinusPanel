import React, { useEffect, useState } from 'react';
import { Link, Prompt } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import PageContentBlock from '@/components/elements/PageContentBlock';
import { usePermissions } from '@/plugins/usePermissions';
import getFileContents from '@/api/server/files/getFileContents';
import saveFileContents from '@/api/server/files/saveFileContents';
import { httpErrorToHuman } from '@/api/http';
import { readProperties, updateProperties } from './properties';
import { vt } from '@/locales/translate';
import styles from './server.module.css';
import form from './properties.module.css';
import MotdEditor from './MotdEditor';

const groups = [
    { title: 'Jeu', fields: [['gamemode','Mode de jeu'],['difficulty','Difficulté'],['force-gamemode','Forcer le mode de jeu'],['hardcore','Hardcore'],['pvp','Joueur contre joueur'],['allow-flight','Autoriser le vol'],['allow-nether','Autoriser le Nether'],['spawn-monsters','Apparition des monstres'],['spawn-animals','Apparition des animaux'],['spawn-npcs','Apparition des villageois']] },
    { title: 'Monde et performances', fields: [['max-players','Places de joueurs'],['view-distance','Distance d’affichage'],['simulation-distance','Distance de simulation'],['spawn-protection','Protection du spawn'],['player-idle-timeout','Inactivité avant expulsion (minutes)'],['level-name','Nom du monde']] },
    { title: 'Accès', fields: [['enable-command-block','Blocs de commande'],['white-list','Liste blanche'],['enforce-whitelist','Appliquer la liste blanche'],['online-mode','Vérifier les comptes auprès de Mojang'],['enforce-secure-profile','Exiger le chat signé']] },
];
const descriptions: Record<string,string> = {
    difficulty: 'Paisible supprime les créatures hostiles. La difficulté influe sur les dégâts et la faim.',
    gamemode: 'Mode des joueurs qui rejoignent le serveur pour la première fois.',
    'force-gamemode': 'Rétablit le mode de jeu par défaut à chaque connexion.',
    hardcore: 'La mort est définitive : le joueur passe en spectateur et ne peut plus réapparaître.',
    pvp: 'Les joueurs peuvent infliger des dégâts aux autres joueurs.',
    'allow-flight': 'Autorise le vol demandé par certains mods et plugins.',
    'allow-nether': 'Permet aux joueurs de rejoindre le Nether.',
    'view-distance': 'Nombre de chunks envoyés au client autour du joueur.',
    'simulation-distance': 'Distance à laquelle les entités et la redstone restent actives.',
    'spawn-protection': 'Rayon protégé autour du spawn. 0 désactive cette protection.',
    'online-mode': 'Vérifie les comptes des joueurs auprès de Mojang.',
    'enforce-secure-profile': 'Exige un profil compatible avec les messages de chat signés.',
};
const choiceLabels: Record<string,string> = { survival: 'Survie', creative: 'Créatif', adventure: 'Aventure', spectator: 'Spectateur', peaceful: 'Paisible', easy: 'Facile', normal: 'Normale', hard: 'Difficile' };
const numbers = ['max-players','view-distance','simulation-distance','spawn-protection','player-idle-timeout'];
const choices: Record<string, string[]> = { gamemode: ['survival','creative','adventure','spectator'], difficulty: ['peaceful','easy','normal','hard'] };
export default function ServerProperties() {
    const server = ServerContext.useStoreState(s => s.server.data!);
    const [canUpdate] = usePermissions(['file.update']);
    const [source, setSource] = useState<string | null>(null);
    const [values, setValues] = useState<Record<string,string>>({});
    const [changes, setChanges] = useState<Record<string,string>>({});
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [saved, setSaved] = useState(false);
    const dirty = Object.keys(changes).length > 0;
    useEffect(() => {
        let active = true; setSource(null); setChanges({}); setError('');
        getFileContents(server.uuid, '/server.properties').then(text => {
            if (active) { setSource(text); setValues(readProperties(text)); }
        }).catch(e => { if (active) setError(httpErrorToHuman(e)); });
        return () => { active = false; };
    }, [server.uuid]);
    useEffect(() => {
        if (!dirty) return;
        const unload = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', unload); return () => window.removeEventListener('beforeunload', unload);
    }, [dirty]);
    const change = (key: string, value: string) => {
        setSaved(false); setChanges(s => { const next = { ...s }; if (value === values[key]) delete next[key]; else next[key] = value; return next; });
    };
    const save = async () => {
        if (source === null || busy || !canUpdate || !dirty) return;
        if (numbers.some(key => key in changes && (!/^\d+$/.test(changes[key]) || Number(changes[key]) > 2147483647))) { setError(vt('Saisissez un nombre entier positif ou nul.')); return; }
        setBusy(true); setError(''); setSaved(false);
        try {
            const current = await getFileContents(server.uuid, '/server.properties');
            if (current !== source) throw new Error(vt('Le fichier a changé depuis son ouverture. Rechargez la page avant d’enregistrer.'));
            const next = updateProperties(source, changes);
            await saveFileContents(server.uuid, '/server.properties', next);
            setSource(next); setValues(readProperties(next)); setChanges({}); setSaved(true);
        } catch (e) { setError(httpErrorToHuman(e)); } finally { setBusy(false); }
    };
    return <PageContentBlock title={`${server.name} | ${vt('Propriétés')}`} className={styles.page}>
        <Prompt when={dirty && !busy} message={vt('Des modifications ne sont pas enregistrées. Quitter cette page ?')} />
        <div className={styles.toolHeading}><div><h2>{vt('Propriétés')}</h2><p>server.properties</p></div><div className={styles.toolbar}>
            <Link className={styles.action} to={`/server/${server.id}/files/edit#/server.properties`}>{vt('Éditeur de fichier')}</Link>
            {canUpdate && <button className={styles.action} type="button" disabled={!dirty || busy} onClick={save}>{busy ? vt('Enregistrement…') : vt('Enregistrer')}</button>}
        </div></div>
        {error && <div role="alert" className={styles.error}>{error}</div>}
        {saved && <p role="status" className={styles.note}>{vt('Propriétés enregistrées. Redémarrez le serveur pour les appliquer.')}</p>}
        {source === null && !error && <p role="status">{vt('Chargement…')}</p>}
        {source !== null && <>
            {'motd' in values && <MotdEditor name={server.name} software={server.softwareProfile?.software} value={changes.motd ?? values.motd} disabled={!canUpdate || busy} onChange={value => change('motd', value)} />}
            {groups.map(group => <section className={form.group} key={group.title}><h3>{vt(group.title)}</h3><div className={form.grid}>
                {group.fields.filter(([key]) => key in values).map(([key,label]) => {
                    const value = changes[key] ?? values[key]; const boolean = values[key] === 'true' || values[key] === 'false';
                    return <label key={key} className={`${form.tile} ${boolean ? form.toggle : ''}`}>
                        {boolean ? <><div><span>{vt(label)}</span>{descriptions[key] && <small>{vt(descriptions[key])}</small>}</div><input className={form.switch} type="checkbox" role="switch" checked={value === 'true'} disabled={!canUpdate || busy} onChange={e => change(key, String(e.target.checked))} /></>
                        : <><span>{vt(label)}</span>{choices[key] ? <select className={styles.input} value={value} disabled={!canUpdate || busy} onChange={e => change(key, e.target.value)}>{!choices[key].includes(value) && <option value={value}>{value}</option>}{choices[key].map(v => <option key={v} value={v}>{vt(choiceLabels[v] || v)}</option>)}</select>
                            : <input className={styles.input} type={numbers.includes(key) ? 'number' : 'text'} min={numbers.includes(key) ? 0 : undefined} step={numbers.includes(key) ? 1 : undefined} value={value} disabled={!canUpdate || busy} onChange={e => change(key, e.target.value)} />}{descriptions[key] && <small>{vt(descriptions[key])}</small>}</>}
                    </label>;
                })}
            </div></section>)}
            <p className={styles.note}>{vt('Seules les propriétés présentes dans le fichier sont affichées. Les commentaires et les autres paramètres sont conservés. Les modifications prennent effet au prochain redémarrage.')}</p>
        </>}
    </PageContentBlock>;
}
