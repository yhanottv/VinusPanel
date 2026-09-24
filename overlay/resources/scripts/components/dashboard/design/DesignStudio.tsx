import React, { useEffect, useRef, useState } from 'react';
import { Prompt, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCloudUploadAlt, faImage, faPalette, faRedo, faServer, faTimes } from '@fortawesome/free-solid-svg-icons';
import { vt } from '@/locales/translate';
import { VinusDesignSettings, ServerDesign, vinusDesign } from '@/vinusDesign';
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
                <input type="color" value={value} aria-label={vt('Choisir {{label}}', {label:vt(label)})} onChange={e => onChange(e.target.value)} />
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

import { designFields, DesignOptions } from '@/designOptions';
import { normalizeDesign, publishDesign, safeDesignUrl, validCssRule } from '@/designRuntime';
import { DesignLink } from '@/vinusDesign';
import Icon, { DashboardIconName } from '@/components/dashboard/DashboardIcon';
import LivePreview from './LivePreview';
import ChoicePreview from './ChoicePreview';
import { navigationCatalog } from './navigationCatalog';

const categories: {id:string;label:string;icon:DashboardIconName}[] = [
 {id:'brand',label:'Identité',icon:'brand'},{id:'colour',label:'Couleurs',icon:'palette'},{id:'type',label:'Typographie',icon:'type'},
 {id:'language',label:'Langue',icon:'language'},{id:'icons',label:'Icônes',icon:'shapes'},{id:'surface',label:'Surfaces',icon:'surface'},
 {id:'layout',label:'Disposition',icon:'layout'},{id:'navigation',label:'Navigation',icon:'list'},{id:'signin',label:'Connexion',icon:'logout'},
 {id:'dashboard',label:'Dashboard',icon:'grid'},{id:'server',label:'Serveurs',icon:'server'},{id:'css',label:'CSS personnalisé',icon:'code'},
 {id:'console',label:'Console',icon:'terminal'},{id:'motion',label:'Animations',icon:'motion'},{id:'seo',label:'Référencement',icon:'search'},
 {id:'addons',label:'Modules',icon:'plus'}
];
function LinkEditor({items,onChange,title}:{items:DesignLink[];onChange:(items:DesignLink[])=>void;title:string}) {
 const update=(index:number,patch:Partial<DesignLink>)=>onChange(items.map((item,i)=>i===index?{...item,...patch}:item));
 return <section className={styles.listEditor}><h3>{title}</h3>{items.map((item,index)=><fieldset key={index}><legend>{index+1}. {vt(item.label)}</legend>
 <label>{vt("Libellé")}<input value={vt(item.label)} maxLength={80} onChange={e=>update(index,{label:e.target.value})}/></label>
 <label>{vt("Adresse")}<input value={item.url} placeholder="https://… ou /account" aria-invalid={!safeDesignUrl(item.url)} onChange={e=>update(index,{url:e.target.value})}/></label>
 <label>{vt("Description")}<input value={item.description} maxLength={300} onChange={e=>update(index,{description:e.target.value})}/></label>
 <label className={styles.toggle}><input type="checkbox" checked={item.visible} onChange={e=>update(index,{visible:e.target.checked})}/>{vt("Visible")}</label>
 <label className={styles.toggle}><input type="checkbox" checked={item.featured} onChange={e=>update(index,{featured:e.target.checked})}/>{vt("Mise en avant")}</label>
 <div className={styles.rowActions}><button type="button" disabled={!index} onClick={()=>{const next=[...items];[next[index-1],next[index]]=[next[index],next[index-1]];onChange(next);}}>{vt("↑ Monter")}</button><button type="button" onClick={()=>onChange(items.filter((_,i)=>i!==index))}>{vt("Supprimer")}</button></div>
 </fieldset>)}<button type="button" className={styles.secondaryButton} onClick={()=>onChange([...items,{label:'Nouveau lien',url:'/account',description:'',featured:false,visible:true}])}>{vt("+ Ajouter")}</button></section>;
}
export default function DesignStudio() {
    const [saved, setSaved] = useState<VinusDesignSettings | null>(null);
    const [draft, setDraft] = useState<VinusDesignSettings | null>(null);
    const [servers, setServers] = useState<StudioServer[]>([]);
    const [selected, setSelected] = useState('');
    useEffect(()=>{const picked=(event:MessageEvent)=>{if(event.origin!==window.location.origin || event.source!==document.querySelector('iframe')?.contentWindow || event.data?.type!=='vinus:studio-picked' || typeof event.data.selector!=='string')return;setDraft(current=>current?{...current,css_rules:[...current.css_rules,{selector:event.data.selector.slice(0,300),declarations:'',enabled:true}]}:current);};window.addEventListener('message',picked);return()=>window.removeEventListener('message',picked);},[]);
    const [previewTick,setPreviewTick]=useState(0);
    const [category,setCategory]=useState('brand');
    const [query,setQuery]=useState('');
    const [device,setDevice]=useState(1600);
    const [light,setLight]=useState(false);
    const [previewPage,setPreviewPage]=useState('dashboard');
    const [optionFiles,setOptionFiles]=useState<Record<string,File>>({});
    const [optionPreviews,setOptionPreviews]=useState<Record<string,string>>({});
    const objectUrls=useRef<string[]>([]);
    useEffect(()=>()=>objectUrls.current.forEach(url=>URL.revokeObjectURL(url)),[]);
    const [logoFile, setLogoFile] = useState<File>();
    const [backgroundFile, setBackgroundFile] = useState<File>();
    const [bannerFiles, setBannerFiles] = useState<Record<string, File>>({});
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        fetch('/admin/vinus-design/data', { credentials: 'same-origin', cache: 'no-store', headers: { Accept: 'application/json' }, signal: controller.signal })
            .then(async response => { if (!response.ok) throw new Error(vt("Impossible de charger les réglages.")); return response.json() as Promise<StudioData>; })
            .then(data => { setSaved(normalizeDesign(data.design)); setDraft(normalizeDesign(data.design)); setServers(data.servers); setSelected(data.servers[0]?.uuid || ''); })
            .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
        return () => controller.abort();
    }, []);

    const serverDraft: ServerDesign = draft?.servers[selected] || {};
    const bannerFile = bannerFiles[selected];
    const logoPreview = useImagePreview(logoFile);
    const backgroundPreview = useImagePreview(backgroundFile);
    const bannerPreview = useImagePreview(bannerFile);
    const changed = !!(saved && draft && (JSON.stringify(saved) !== JSON.stringify(draft) || logoFile || backgroundFile || Object.keys(bannerFiles).length || Object.keys(optionFiles).length));

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
        setDraft(saved); setLogoFile(undefined); setBackgroundFile(undefined); setBannerFiles({}); setOptionFiles({}); setOptionPreviews({}); setError(''); setMessage('');
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
        if ([...draft.links,...draft.cards].some(link=>!link.label.trim() || !link.url || !safeDesignUrl(link.url))) { setError(vt('Vérifiez les libellés et adresses des liens.')); return; }
        if (draft.css_rules.some(rule=>!validCssRule(rule.selector,rule.declarations))) { setError(vt('Une règle CSS contient une syntaxe non autorisée.')); return; }
        setBusy(true); setError(''); setMessage('');
        try {
            let latest = saved;
            const globalFields: (ColorKey | 'brand_name' | 'logo' | 'background_image')[] = ['brand_name', 'accent', 'background', 'surface', 'server_card', 'text', 'logo', 'background_image'];
            const globalChanged = JSON.stringify(saved.options)!==JSON.stringify(draft.options) || JSON.stringify(saved.navigation)!==JSON.stringify(draft.navigation) || JSON.stringify(saved.console_rules)!==JSON.stringify(draft.console_rules) || JSON.stringify(saved.links)!==JSON.stringify(draft.links) || JSON.stringify(saved.cards)!==JSON.stringify(draft.cards) || JSON.stringify(saved.css_rules)!==JSON.stringify(draft.css_rules) || Object.keys(optionFiles).length>0 || globalFields.some(key => saved[key] !== draft[key]) || !!logoFile || !!backgroundFile;
            if (globalChanged) {
                const form = new FormData();
                form.append('studio',JSON.stringify({options:draft.options,navigation:draft.navigation,console_rules:draft.console_rules,links:draft.links,cards:draft.cards,css_rules:draft.css_rules}));
                Object.entries(optionFiles).forEach(([key,file])=>form.append(`option_images[${key}]`,file));
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
            latest=normalizeDesign(latest);
            publishDesign(latest);
            setSaved(latest); setDraft(latest); setLogoFile(undefined); setBackgroundFile(undefined); setBannerFiles({});
            setOptionFiles({}); setOptionPreviews({});
            setMessage(vt("Modifications enregistrées."));
        } catch (e) {
            setError(e instanceof Error ? e.message : vt("L’enregistrement a échoué."));
        } finally { setBusy(false); }
    };


    if (!draft) return <div className={styles.loading}>{error || vt('Chargement du studio Design…')}</div>;
    const choose=(id:string)=>{setCategory(id);setQuery('');if(id==='signin')setPreviewPage('login');else if(id==='console')setPreviewPage('console');else if(id==='server')setPreviewPage('overview');else setPreviewPage('dashboard');};
    const option=(key:keyof DesignOptions,value:string|number|boolean)=>{setDraft({...draft,options:{...draft.options,[key]:value}});setMessage('');};
    const previewDesign:VinusDesignSettings={...draft,logo:logoPreview||draft.logo,background_image:backgroundPreview||draft.background_image,options:{...draft.options,...optionPreviews},servers:{...draft.servers,...(selected?{[selected]:{...serverDraft,banner:bannerPreview||serverDraft.banner}}:{})}};
    const previewPath=previewPage==='login'?'/design/preview/login':(previewPage==='console'||previewPage==='overview')&&selected?`/server/${selected.slice(0,8)}${previewPage==='overview'?'/overview':''}`:'/';
    const fields=designFields.filter(field=>query?vt(field.label).toLocaleLowerCase().includes(query.toLocaleLowerCase()):field.category===category);
    const title=categories.find(item=>item.id===category)?.label;
    return <div className={styles.studio}>
        <Prompt when={changed} message={vt('Des modifications ne sont pas enregistrées. Quitter cette page ?')} />
        <nav className={styles.rail} aria-label={vt("Catégories de personnalisation")}>
            <span className={styles.railMark}><Icon name="brush" /></span>
            {categories.map(item=><button type="button" key={item.id} title={vt(item.label)} aria-label={vt(item.label)} aria-pressed={category===item.id&&!query} onClick={()=>choose(item.id)}><Icon name={item.icon}/></button>)}
            <Link to="/" className={styles.exit} title={vt("Fermer le studio")} aria-label={vt("Fermer le studio")}><Icon name="close"/></Link>
        </nav>
        <aside className={styles.controls}>
            <header className={styles.controlsHeader}><small>{vt("VINUSPANEL / DESIGN")}</small><h1>{query?vt('Recherche'):vt(title||'')}</h1><input aria-label={vt("Rechercher un réglage")} placeholder={vt("Rechercher un réglage…")} value={query} onChange={e=>setQuery(e.target.value)}/></header>
            <div className={styles.controlsBody}>
                {category==='brand'&&!query&&<><label className={styles.textLabel}>{vt("Nom du panel")}<input className={styles.textInput} value={draft.brand_name} maxLength={40} onChange={e=>setField('brand_name',e.target.value)}/></label><ImageControl id="design-logo" title={vt("Logo du panel")} hint="PNG, JPG ou WebP · 4 Mo max" src={draft.logo} preview={logoPreview} file={logoFile} maxMb={4} onFile={setLogoFile} onRemove={()=>{setLogoFile(undefined);setField('logo',defaultLogo);}}/></>}
                {category==='colour'&&!query&&<div className={styles.colorGrid}>{colorFields.map(field=><ColorControl key={field.key} id={field.key} label={vt(field.label)} value={draft[field.key]} onChange={value=>setField(field.key,value)}/>)}</div>}
                {fields.map(field=><div className={styles.option} key={field.key}>
                    {field.kind==='toggle'?<label className={styles.toggle}><span>{vt(field.label)}</span><input type="checkbox" role="switch" checked={Boolean(draft.options[field.key])} onChange={e=>option(field.key,e.target.checked)}/></label>:
                    field.kind==='color'?<ColorControl id={field.key} label={vt(field.label)} value={String(draft.options[field.key])} onChange={value=>option(field.key,value)}/>:
                    field.kind==='select'?<fieldset><legend>{vt(field.label)}</legend><div className={styles.choices}>{field.choices?.map(choice=><button type="button" key={choice.value} aria-pressed={draft.options[field.key]===choice.value} onClick={()=>{option(field.key,choice.value);setPreviewTick(t=>t+1);}}><ChoicePreview field={field.key} value={choice.value} duration={draft.options.motion_duration} tick={draft.options[field.key]===choice.value?previewTick:0}/><span className={styles.choiceLabel}><span aria-hidden="true">{draft.options[field.key]===choice.value?'✓':''}</span>{vt(choice.label)}</span></button>)}</div></fieldset>:
                    field.kind==='range'?<label className={styles.range}><span>{vt(field.label)}<output>{String(draft.options[field.key])}</output></span><input aria-label={vt(field.label)} type="range" min={field.min} max={field.max} value={Number(draft.options[field.key])} onChange={e=>option(field.key,Number(e.target.value))}/></label>:
                    <label className={styles.textLabel}>{vt(field.label)}{field.kind==='textarea'?<textarea value={String(draft.options[field.key])} maxLength={2000} onChange={e=>option(field.key,e.target.value)}/>:<input className={styles.textInput} value={String(draft.options[field.key])} maxLength={2000} onChange={e=>option(field.key,e.target.value)}/>}</label>}
                    {field.kind==='image'&&<ImageControl id={field.key+'-upload'} title={vt("Importer une image")} hint="PNG, JPG ou WebP · 4 Mo max" src={String(draft.options[field.key])} preview={optionPreviews[field.key]} file={optionFiles[field.key]} maxMb={4} onFile={file=>{const url=URL.createObjectURL(file);objectUrls.current.push(url);setOptionFiles({...optionFiles,[field.key]:file});setOptionPreviews({...optionPreviews,[field.key]:url});}} onRemove={()=>{const files={...optionFiles},previews={...optionPreviews};delete files[field.key];delete previews[field.key];setOptionFiles(files);setOptionPreviews(previews);option(field.key,'');}}/>}
                </div>)}
                {category==='motion'&&!query&&<><p className={styles.hint}>{vt("Survolez ou sélectionnez une vignette pour voir l’effet. Le réglage de réduction des animations de votre appareil est respecté.")}</p><button type="button" className={styles.secondaryButton} onClick={()=>{setPreviewTick(t=>t+1);window.dispatchEvent(new Event('vinus:preview-replay'));}}>{vt("Rejouer l’animation de la page")}</button></>}
                {category==='icons'&&!query&&<div className={styles.iconSample} style={{'--sample-size':`${draft.options.icon_size}px`,'--sample-weight':draft.options.icon_weight/10} as React.CSSProperties} data-corners={draft.options.icon_style}>{(['grid','user','server','controls'] as DashboardIconName[]).map(name=><Icon key={name} name={name} family={draft.options.icon_family}/>)}</div>}
                {category==='surface'&&!query&&<ImageControl id="design-background" title={vt("Image de fond")} hint="PNG, JPG ou WebP · 8 Mo max" src={draft.background_image} preview={backgroundPreview} file={backgroundFile} maxMb={8} onFile={setBackgroundFile} onRemove={()=>{setBackgroundFile(undefined);setField('background_image','');}}/>}
                {category==='navigation'&&!query&&<section className={styles.listEditor}><h3>{vt("Pages du panel et du serveur")}</h3><p className={styles.hint}>{vt("Les destinations et permissions restent celles du panel.")}</p>{navigationCatalog.map(base=>{const rule=draft.navigation.find(item=>item.path===base.path)||base;const update=(patch:Partial<typeof rule>)=>setDraft({...draft,navigation:[...draft.navigation.filter(item=>item.path!==base.path),{...rule,...patch}]});return <details key={base.path}><summary>{rule.label||base.label}</summary><label>{vt("Libellé")}<input value={rule.label} onChange={e=>update({label:e.target.value})}/></label><label className={styles.toggle}>{vt("Visible")}<input type="checkbox" checked={rule.visible} onChange={e=>update({visible:e.target.checked})}/></label><label>{vt("Position dans le groupe")}<input type="number" min={0} max={100} value={rule.order} onChange={e=>update({order:Number(e.target.value)})}/></label></details>;})}</section>}
                {category==='console'&&!query&&<section className={styles.listEditor}><h3>{vt("Réécriture des journaux")}</h3><p className={styles.hint}>{vt("Remplacements de texte à l’affichage uniquement. Les fichiers du serveur restent intacts.")}</p>{draft.console_rules.map((rule,index)=><fieldset key={index}><label>{vt("Texte à remplacer")}<input value={rule.search} maxLength={200} onChange={e=>setDraft({...draft,console_rules:draft.console_rules.map((r,i)=>i===index?{...r,search:e.target.value}:r)})}/></label><label>{vt("Remplacement")}<textarea value={rule.replacement} maxLength={1000} onChange={e=>setDraft({...draft,console_rules:draft.console_rules.map((r,i)=>i===index?{...r,replacement:e.target.value}:r)})}/></label><button onClick={()=>setDraft({...draft,console_rules:draft.console_rules.filter((_,i)=>i!==index)})}>{vt("Supprimer")}</button></fieldset>)}<button className={styles.secondaryButton} onClick={()=>setDraft({...draft,console_rules:[...draft.console_rules,{search:'Texte',replacement:''}]})}>{vt("+ Ajouter une règle")}</button></section>}
                {category==='navigation'&&!query&&<LinkEditor title={vt("Liens personnalisés")} items={draft.links} onChange={links=>setDraft({...draft,links})}/>}
                {category==='dashboard'&&!query&&<><p className={styles.hint}>{vt("Une liste vide conserve les quatre raccourcis par défaut.")}</p><LinkEditor title={vt("Cartes de raccourcis")} items={draft.cards} onChange={cards=>setDraft({...draft,cards})}/></>}
                {category==='server'&&!query&&<section className={styles.listEditor}><h3>{vt("Identité du serveur")}</h3>{servers.length?<><label className={styles.textLabel}>{vt("Serveur")}<select value={selected} onChange={e=>setSelected(e.target.value)}>{servers.map(server=><option key={server.uuid} value={server.uuid}>{server.name}</option>)}</select></label><ColorControl id="server-color" label="Couleur de la carte" value={serverDraft.color||draft.server_card} onChange={color=>setServer(selected,{color})}/><button className={styles.textButton} onClick={()=>setServer(selected,{color:''})}>{vt("Couleur par défaut")}</button><ImageControl id="design-banner" title={vt("Bannière du serveur")} hint="PNG, JPG ou WebP · 8 Mo max" src={serverDraft.banner||''} preview={bannerPreview} file={bannerFile} maxMb={8} onFile={file=>setBannerFiles({...bannerFiles,[selected]:file})} onRemove={()=>{const next={...bannerFiles};delete next[selected];setBannerFiles(next);setServer(selected,{banner:''});}}/></>:<p>{vt("Aucun serveur disponible.")}</p>}</section>}
                {category==='css'&&!query&&<section className={styles.listEditor}><button type="button" className={styles.secondaryButton} onClick={()=>window.dispatchEvent(new Event('vinus:pick-start'))}>{vt("Sélectionner un élément dans l’aperçu")}</button><p className={styles.hint}>{vt("Règles appliquées au panel et à son aperçu. Les imports, URL et scripts sont refusés.")}</p>{draft.css_rules.map((rule,index)=><fieldset key={index}><legend>{vt('Règle')} {index+1}</legend><label>{vt("Sélecteur")}<input value={rule.selector} placeholder=".app-shell h1" onChange={e=>setDraft({...draft,css_rules:draft.css_rules.map((r,i)=>i===index?{...r,selector:e.target.value}:r)})}/></label><label>{vt("Déclarations")}<textarea value={rule.declarations} placeholder="letter-spacing: -0.03em;" onChange={e=>setDraft({...draft,css_rules:draft.css_rules.map((r,i)=>i===index?{...r,declarations:e.target.value}:r)})}/></label><label className={styles.toggle}>{vt("Activée")}<input type="checkbox" checked={rule.enabled} onChange={e=>setDraft({...draft,css_rules:draft.css_rules.map((r,i)=>i===index?{...r,enabled:e.target.checked}:r)})}/></label><button type="button" onClick={()=>setDraft({...draft,css_rules:draft.css_rules.filter((_,i)=>i!==index)})}>{vt("Supprimer")}</button></fieldset>)}<button className={styles.secondaryButton} onClick={()=>setDraft({...draft,css_rules:[...draft.css_rules,{selector:'.app-shell h1',declarations:'',enabled:true}]})}>{vt("+ Ajouter une règle")}</button></section>}
                {category==='addons'&&!query&&<><h3>{vt("Modules du projet")}</h3><p className={styles.hint}>{vt("Les intégrations Blueprint existantes sont conservées. Les outils Minecraft apparaissent selon le logiciel du serveur et ses permissions.")}</p>{['Plugins et mods','Modpacks','Versions Minecraft','Joueurs','Propriétés','Mondes et World Viewer'].map(name=><div className={styles.addon} key={name}><Icon name="check"/>{vt(name)}</div>)}</>}
                {query&&!fields.length&&<p>{vt("Aucun réglage trouvé.")}</p>}
            </div>
            <footer className={styles.saveBar}>
                <p role="status" className={error?styles.error:styles.hint}>{error||message||vt(changed?'Modifications non enregistrées':'Toutes les modifications sont enregistrées')}</p>
                <div><button type="button" className={styles.secondaryButton} onClick={reset} disabled={!changed||busy}>{vt("Annuler")}</button><button type="button" className={styles.primaryButton} onClick={save} disabled={!changed||busy}>{vt(busy?'Enregistrement…':'Enregistrer')}</button></div>
            </footer>
        </aside>
        <main className={styles.previewArea}>
            <header className={styles.previewToolbar}><div className={styles.deviceTabs}>{[[1600,'Ordinateur'],[768,'Tablette'],[390,'Mobile']].map(([width,label])=><button type="button" key={width} aria-pressed={device===width} onClick={()=>setDevice(Number(width))}>{vt(String(label))}</button>)}<small>{device} px</small></div><div className={styles.previewSelectors}><select aria-label={vt("Page de l’aperçu")} value={previewPage} onChange={e=>setPreviewPage(e.target.value)}><option value="dashboard">{vt("Dashboard")}</option><option value="overview">{vt("Aperçu serveur")}</option><option value="console">{vt("Console")}</option><option value="login">{vt("Connexion")}</option></select>{(previewPage==='console'||previewPage==='overview')&&<select aria-label={vt("Serveur de l’aperçu")} value={selected} onChange={e=>setSelected(e.target.value)}>{servers.map(server=><option key={server.uuid} value={server.uuid}>{server.name}</option>)}</select>}{previewPage!=='login'&&<button type="button" aria-pressed={light} onClick={()=>setLight(!light)}>{vt(light?'Clair':'Sombre')}</button>}</div></header>
            <LivePreview design={previewDesign} path={previewPath} device={device} light={light}/>
            <p className={styles.previewNote}><span className={styles.liveDot}/>{vt("Aperçu en direct · Les actions du serveur sont désactivées dans l’aperçu.")}</p>
        </main>
    </div>;
}
