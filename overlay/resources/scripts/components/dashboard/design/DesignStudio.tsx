import React, { useEffect, useRef, useState } from 'react';
import { Prompt } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCloudUploadAlt, faImage, faPalette, faRedo, faServer, faTimes } from '@fortawesome/free-solid-svg-icons';
import { vt } from '@/locales/translate';
import { VinusDesignSettings, ServerDesign, vinusDesign } from '@/vinusDesign';
import DashboardContainer from '@/components/dashboard/DashboardContainer';
import ServerRow from '@/components/dashboard/ServerRow';
import getServer, { Server } from '@/api/server/getServer';
import styles from './style.module.css';

interface StudioServer { uuid: string; name: string }
interface StudioData { design: VinusDesignSettings; servers: StudioServer[] }
type ColorKey = 'accent' | 'background' | 'surface' | 'server_card' | 'text';
const defaultLogo = '/assets/images/vinus/eagle.png';
const colorPattern = /^#[0-9a-fA-F]{6}$/;

function useImagePreview(file?: File): string {
    const [url, setUrl] = useState('');
    useEffect(() => {
        if (!file) { setUrl(''); return; }
        const next = URL.createObjectURL(file);
        setUrl(next);
        return () => URL.revokeObjectURL(next);
    }, [file]);
    return url;
}

function ColorControl({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
    const [hex, setHex] = useState(value);
    useEffect(() => setHex(value), [value]);
    return <div className={styles.colorControl}>
        <label htmlFor={`${id}-hex`}>{vt(label)}</label>
        <div className={styles.colorInput}>
            <span className={styles.swatch} style={{ backgroundColor: value }}>
                <input type="color" value={value} aria-label={vt(`Choisir ${label.toLowerCase()}`)} onChange={e => onChange(e.target.value)} />
            </span>
            <input id={`${id}-hex`} className={styles.hex} value={hex} maxLength={7} spellCheck={false}
                aria-invalid={!colorPattern.test(hex)} onChange={e => {
                    const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
                    setHex(next);
                    if (colorPattern.test(next)) onChange(next.toLowerCase());
                }} onBlur={() => { if (!colorPattern.test(hex)) setHex(value); }} />
        </div>
    </div>;
}

function ImageControl({ id, title, hint, src, preview, file, maxMb, onFile, onRemove }: {
    id: string; title: string; hint: string; src: string; preview?: string; file?: File; maxMb: number;
    onFile: (file: File) => void; onRemove: () => void;
}) {
    const shown = preview || src;
    return <div className={styles.imageControl}>
        <div className={styles.fieldHeading}><label htmlFor={id}>{vt(title)}</label><small>{vt(hint)}</small></div>
        <div className={styles.imageRow}>
            <div className={styles.thumbnail}>{shown ? <img src={shown} alt="" /> : <FontAwesomeIcon icon={faImage} />}</div>
            <div className={styles.imageActions}>
                <label className={styles.uploadButton} htmlFor={id}><FontAwesomeIcon icon={faCloudUploadAlt} /> {vt("Choisir une image")}</label>
                <input className={styles.visuallyHidden} id={id} type="file" accept="image/png,image/jpeg,image/webp"
                    onChange={e => {
                        const chosen = e.target.files?.[0];
                        if (chosen) {
                            if (chosen.size > maxMb * 1024 * 1024) { window.alert(vt("Image trop volumineuse")); }
                            else onFile(chosen);
                        }
                        e.target.value = '';
                    }} />
                <span className={styles.fileName}>{file ? file.name : shown ? vt("Image actuelle") : vt("Aucune image")}</span>
            </div>
            {(shown || file) && <button type="button" className={styles.iconButton} onClick={onRemove} aria-label={vt("Supprimer l’image")} title={vt("Supprimer l’image")}><FontAwesomeIcon icon={faTimes} /></button>}
        </div>
    </div>;
}

const colorFields: { key: ColorKey; label: string }[] = [
    { key: 'accent', label: 'Couleur principale' },
    { key: 'background', label: 'Fond du panel' },
    { key: 'surface', label: 'Panneaux et navigation' },
    { key: 'server_card', label: 'Carte serveur' },
    { key: 'text', label: 'Texte principal' },
];

export default function DesignStudio() {
    const [saved, setSaved] = useState<VinusDesignSettings | null>(null);
    const [draft, setDraft] = useState<VinusDesignSettings | null>(null);
    const [servers, setServers] = useState<StudioServer[]>([]);
    const [selected, setSelected] = useState('');
    const [tab, setTab] = useState<'panel' | 'server'>('panel');
    const [logoFile, setLogoFile] = useState<File>();
    const [backgroundFile, setBackgroundFile] = useState<File>();
    const [bannerFiles, setBannerFiles] = useState<Record<string, File>>({});
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [previewServer, setPreviewServer] = useState<Server | null>(null);
    const [previewError, setPreviewError] = useState('');
    const originalStyles = useRef<Record<string, string>>({});

    useEffect(() => {
        const controller = new AbortController();
        const root = document.documentElement;
        const keys = ['--vinus-accent', '--vinus-accent-rgb', '--vinus-bg', '--vinus-glass', '--vinus-surface', '--vinus-server-card', '--vinus-text', '--vinus-background-image'];
        keys.forEach(key => { originalStyles.current[key] = root.style.getPropertyValue(key); });
        fetch('/admin/vinus-design/data', { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: controller.signal })
            .then(async response => { if (!response.ok) throw new Error(vt("Impossible de charger les réglages.")); return response.json() as Promise<StudioData>; })
            .then(data => { setSaved(data.design); setDraft(data.design); setServers(data.servers); setSelected(data.servers[0]?.uuid || ''); })
            .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
        return () => { controller.abort(); keys.forEach(key => {
            const original = originalStyles.current[key];
            if (original) root.style.setProperty(key, original); else root.style.removeProperty(key);
        }); window.dispatchEvent(new CustomEvent('vinus:design-preview', { detail: { name: vinusDesign.brand_name, logo: vinusDesign.logo } })); };
    }, []);

    const selectedServer = servers.find(server => server.uuid === selected);
    const serverDraft: ServerDesign = draft?.servers[selected] || {};
    const bannerFile = bannerFiles[selected];
    const logoPreview = useImagePreview(logoFile);
    const backgroundPreview = useImagePreview(backgroundFile);
    const bannerPreview = useImagePreview(bannerFile);
    const changed = !!(saved && draft && (JSON.stringify(saved) !== JSON.stringify(draft) || logoFile || backgroundFile || Object.keys(bannerFiles).length));

    useEffect(() => {
        if (tab !== 'server' || !selected) return;
        let active = true;
        setPreviewServer(null);
        setPreviewError('');
        getServer(selected.slice(0, 8))
            .then(([server]) => { if (active) setPreviewServer(server); })
            .catch(() => { if (active) setPreviewError(vt("Impossible de charger ce serveur pour l’aperçu.")); });
        return () => { active = false; };
    }, [tab, selected]);

    useEffect(() => {
        if (!draft) return;
        const root = document.documentElement;
        const rgb = draft.accent.match(/[0-9a-fA-F]{2}/g)?.map(value => parseInt(value, 16)).join(', ') || '255, 122, 26';
        root.style.setProperty('--vinus-accent', draft.accent);
        root.style.setProperty('--vinus-accent-rgb', rgb);
        root.style.setProperty('--vinus-bg', draft.background);
        root.style.setProperty('--vinus-glass', draft.surface);
        root.style.setProperty('--vinus-surface', draft.surface);
        root.style.setProperty('--vinus-server-card', draft.server_card);
        root.style.setProperty('--vinus-text', draft.text);
        const image = backgroundPreview || draft.background_image;
        root.style.setProperty('--vinus-background-image', image ? `url("${image.replace(/"/g, '%22')}")` : 'none');
        window.dispatchEvent(new CustomEvent('vinus:design-preview', { detail: { name: draft.brand_name, logo: logoPreview || draft.logo } }));
    }, [draft, logoPreview, backgroundPreview]);

    useEffect(() => {
        const onBeforeUnload = (event: BeforeUnloadEvent) => { if (changed) { event.preventDefault(); event.returnValue = ''; } };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [changed]);

    const setField = (key: ColorKey | 'brand_name' | 'logo' | 'background_image', value: string) => {
        setDraft(current => current ? { ...current, [key]: value } : current);
        setMessage('');
    };
    const setServer = (uuid: string, patch: ServerDesign) => {
        setDraft(current => current ? { ...current, servers: { ...current.servers, [uuid]: { ...current.servers[uuid], ...patch } } } : current);
        setMessage('');
    };
    const reset = () => {
        setDraft(saved); setLogoFile(undefined); setBackgroundFile(undefined); setBannerFiles({}); setError(''); setMessage('');
    };
    const post = async (url: string, form: FormData): Promise<VinusDesignSettings> => {
        const token = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';
        const response = await fetch(url, { method: 'POST', credentials: 'same-origin', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': token }, body: form });
        if (!response.ok) {
            const payload = await response.json().catch(() => null);
            throw new Error(payload?.message || vt("L’enregistrement a échoué."));
        }
        return (await response.json()).design;
    };
    const save = async () => {
        if (!saved || !draft || busy) return;
        if (!draft.brand_name.trim()) { setError(vt("Indiquez un nom pour le panel.")); return; }
        setBusy(true); setError(''); setMessage('');
        try {
            let latest = saved;
            const globalFields: (ColorKey | 'brand_name' | 'logo' | 'background_image')[] = ['brand_name', 'accent', 'background', 'surface', 'server_card', 'text', 'logo', 'background_image'];
            const globalChanged = globalFields.some(key => saved[key] !== draft[key]) || !!logoFile || !!backgroundFile;
            if (globalChanged) {
                const form = new FormData();
                (['brand_name', 'accent', 'background', 'surface', 'server_card', 'text'] as const).forEach(key => form.append(key, draft[key]));
                if (logoFile) form.append('logo_file', logoFile);
                else if (saved.logo !== draft.logo && draft.logo === defaultLogo) form.append('remove_logo', '1');
                if (backgroundFile) form.append('background_file', backgroundFile);
                else if (saved.background_image && !draft.background_image) form.append('remove_background', '1');
                latest = await post('/admin/vinus-design', form);
            }
            const uuids = new Set([...Object.keys(saved.servers), ...Object.keys(draft.servers), ...Object.keys(bannerFiles)]);
            for (const uuid of uuids) {
                const before = saved.servers[uuid] || {};
                const after = draft.servers[uuid] || {};
                if (JSON.stringify(before) === JSON.stringify(after) && !bannerFiles[uuid]) continue;
                const form = new FormData();
                if (after.color) form.append('color', after.color);
                else form.append('remove_color', '1');
                if (bannerFiles[uuid]) form.append('banner_file', bannerFiles[uuid]);
                else if (before.banner && !after.banner) form.append('remove_banner', '1');
                latest = await post(`/admin/vinus-design/servers/${encodeURIComponent(uuid)}`, form);
            }
            Object.assign(vinusDesign, latest);
            setSaved(latest); setDraft(latest); setLogoFile(undefined); setBackgroundFile(undefined); setBannerFiles({});
            setMessage(vt("Modifications enregistrées."));
            const root = document.documentElement;
            const rgb = latest.accent.match(/[0-9a-fA-F]{2}/g)?.map(value => parseInt(value, 16)).join(', ') || '255, 122, 26';
            const persistedStyles: Record<string, string> = {
                '--vinus-accent': latest.accent, '--vinus-accent-rgb': rgb, '--vinus-bg': latest.background,
                '--vinus-glass': latest.surface, '--vinus-surface': latest.surface,
                '--vinus-server-card': latest.server_card, '--vinus-text': latest.text,
                '--vinus-background-image': latest.background_image ? `url("${latest.background_image}")` : 'none',
            };
            Object.entries(persistedStyles).forEach(([key, value]) => { root.style.setProperty(key, value); originalStyles.current[key] = value; });
        } catch (e) {
            setError(e instanceof Error ? e.message : vt("L’enregistrement a échoué."));
        } finally { setBusy(false); }
    };

    if (!draft) return <div className={styles.loading}>{error || vt("Chargement du studio Design…")}</div>;
    const previewBackground = backgroundPreview || draft.background_image;
    const previewBanner = bannerPreview || serverDraft.banner;
    const previewDesign: VinusDesignSettings = {
        ...draft,
        logo: logoPreview || draft.logo,
        background_image: previewBackground,
        servers: previewBanner && selected ? {
            ...draft.servers,
            [selected]: { ...serverDraft, banner: previewBanner },
        } : draft.servers,
    };
    return <div className={styles.studio}>
        <Prompt when={changed} message={vt("Des modifications ne sont pas enregistrées. Quitter cette page ?")} />
        <header className={styles.pageHeader}>
            <div><span className={styles.eyebrow}><FontAwesomeIcon icon={faPalette} /> VINUSPANEL / STUDIO</span>
                <h1>{vt("Design")}</h1><p>{vt("Personnalisez votre panel et voyez le résultat immédiatement.")}</p></div>
            <div className={styles.headerActions}>
                {changed && <span className={styles.unsaved}>{vt("Modifications non enregistrées")}</span>}
                <button type="button" className={styles.secondaryButton} onClick={reset} disabled={!changed || busy}><FontAwesomeIcon icon={faRedo} /> {vt("Annuler")}</button>
                <button type="button" className={styles.primaryButton} onClick={save} disabled={!changed || busy}><FontAwesomeIcon icon={faCheck} /> {busy ? vt("Enregistrement…") : vt("Enregistrer")}</button>
            </div>
        </header>
        {(message || error) && <div className={error ? styles.error : styles.success} role="status">{error || message}</div>}
        <div className={styles.workbench}>
            <section className={styles.controls} aria-label={vt("Réglages du design")}>
                <div className={styles.tabs} role="tablist" aria-label={vt("Zone à personnaliser")}>
                    <button type="button" role="tab" aria-selected={tab === 'panel'} className={tab === 'panel' ? styles.activeTab : ''} onClick={() => setTab('panel')}><FontAwesomeIcon icon={faPalette} /> {vt("Panel")}</button>
                    <button type="button" role="tab" aria-selected={tab === 'server'} className={tab === 'server' ? styles.activeTab : ''} onClick={() => setTab('server')}><FontAwesomeIcon icon={faServer} /> {vt("Serveurs")}</button>
                </div>
                <div className={styles.controlsBody}>
                    {tab === 'panel' ? <>
                        <div className={styles.sectionIntro}><span>01 / {vt("Identité")}</span><h2>{vt("Votre panel, votre marque")}</h2><p>{vt("Nom, logo et arrière-plan visibles par vos utilisateurs.")}</p></div>
                        <label className={styles.textLabel} htmlFor="brand-name">{vt("Nom du panel")}</label>
                        <input id="brand-name" className={styles.textInput} value={draft.brand_name} maxLength={40} onChange={e => setField('brand_name', e.target.value)} />
                        <ImageControl id="design-logo" title="Logo du panel" hint="PNG, JPG ou WebP · 4 Mo max" src={draft.logo} preview={logoPreview} file={logoFile} maxMb={4}
                            onFile={file => { setLogoFile(file); setMessage(''); }} onRemove={() => { setLogoFile(undefined); setField('logo', defaultLogo); }} />
                        <ImageControl id="design-background" title="Image de fond" hint="PNG, JPG ou WebP · 8 Mo max" src={draft.background_image} preview={backgroundPreview} file={backgroundFile} maxMb={8}
                            onFile={file => { setBackgroundFile(file); setMessage(''); }} onRemove={() => { setBackgroundFile(undefined); setField('background_image', ''); }} />
                        <div className={styles.sectionIntro}><span>02 / {vt("Couleurs")}</span><h2>{vt("Une palette à votre image")}</h2><p>{vt("Touchez le carré pour ouvrir le nuancier, ou saisissez un code hexadécimal.")}</p></div>
                        <div className={styles.colorGrid}>{colorFields.map(field => <ColorControl key={field.key} id={field.key} label={field.label} value={draft[field.key]} onChange={value => setField(field.key, value)} />)}</div>
                    </> : <>
                        <div className={styles.sectionIntro}><span>03 / {vt("Serveurs")}</span><h2>{vt("Une identité par serveur")}</h2><p>{vt("Choisissez un serveur pour adapter sa carte et sa bannière.")}</p></div>
                        {servers.length ? <>
                            <label className={styles.textLabel} htmlFor="design-server">{vt("Serveur à personnaliser")}</label>
                            <select id="design-server" className={styles.textInput} value={selected} onChange={e => setSelected(e.target.value)}>{servers.map(server => <option key={server.uuid} value={server.uuid}>{server.name}</option>)}</select>
                            <ColorControl id="server-color" label="Couleur de la carte" value={serverDraft.color || draft.server_card} onChange={value => setServer(selected, { color: value })} />
                            {!!serverDraft.color && <button type="button" className={styles.textButton} onClick={() => setServer(selected, { color: '' })}>{vt("Utiliser la couleur par défaut")}</button>}
                            <ImageControl id="design-banner" title="Bannière du serveur" hint="PNG, JPG ou WebP · 8 Mo max · format 3:1 conseillé" src={serverDraft.banner || ''} preview={bannerPreview} file={bannerFile} maxMb={8}
                                onFile={file => { setBannerFiles(current => ({ ...current, [selected]: file })); setMessage(''); }}
                                onRemove={() => { setBannerFiles(current => { const next = { ...current }; delete next[selected]; return next; }); setServer(selected, { banner: '' }); }} />
                        </> : <p className={styles.empty}>{vt("Aucun serveur disponible.")}</p>}
                    </>}
                </div>
            </section>
            <section className={styles.previewArea} aria-label={vt("Aperçu direct")}>
                <div className={styles.previewHeading}><div><span className={styles.liveDot} /> <strong>{vt("Aperçu réel")}</strong><span>{vt("Modifications visibles avant l’enregistrement.")}</span></div><span className={styles.previewTag}>{tab === 'panel' ? vt("Tableau de bord") : selectedServer?.name || vt("Serveur")}</span></div>
                <div className={styles.realPreview} style={{ backgroundColor: draft.background, backgroundImage: previewBackground ? `url("${previewBackground.replace(/"/g, '%22')}")` : undefined }}>
                    <div className={styles.realPreviewContent}>
                        {tab === 'panel' ? <DashboardContainer preview design={previewDesign} /> : (
                            <div className={styles.realPreviewServer}>
                                <span className={styles.previewEyebrow}>{vt("CARTE RÉELLE DU SERVEUR")}</span>
                                <h2>{selectedServer?.name || vt("Serveur")}</h2>
                                {previewServer ? <ServerRow server={previewServer} view="grid" design={previewDesign} /> : <p>{previewError || vt("Chargement du serveur…")}</p>}
                            </div>
                        )}
                    </div>
                </div>
                <p className={styles.previewNote}>{vt("Vrais composants et vraies données du panel. Enregistrez pour appliquer à tous les utilisateurs.")}</p>
            </section>
        </div>
    </div>;
}
