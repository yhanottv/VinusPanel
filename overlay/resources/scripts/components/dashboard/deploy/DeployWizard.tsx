import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { vt } from '@/locales/translate';
import getServers from '@/api/getServers';
import styles from './deploy.module.css';

const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

interface AllocationInfo { id: number; ip: string; port: number; alias: string | null }
interface MemoryPreset { value: number; label: string }
interface NodeInfo {
    id: number; name: string; fqdn: string;
    memory: number; disk: number; memory_overallocate: number; disk_overallocate: number;
    memory_presets: MemoryPreset[];
    cpu_presets: number[];
    cpu_cores: number;
    allocations: AllocationInfo[];
}
interface VariableInfo { env_variable: string; name: string; default_value: string; rules: string }
interface CatalogVersion { id: string; channel: string; supported: boolean }
interface CatalogBuild { id: string; name: string; experimental: boolean }
interface EggInfo { id: number; name: string; startup: string; images: string[]; type?: string | null; versions?: CatalogVersion[]; builds?: CatalogBuild[]; variables: VariableInfo[] }
interface NestInfo { id: number; name: string; eggs: EggInfo[] }
interface UserInfo { id: number; email: string; username: string }
interface DeployData { nodes: NodeInfo[]; nests: NestInfo[]; users: UserInfo[] }

const STEPS = ['IDENTITY', 'RESOURCES', 'ACCESS', 'SOFTWARE', 'REVIEW'] as const;

const STORE_KEY = 'vinus:deploy:state';
const ABANDONED_KEY = 'vinus:deploy:abandoned';

const isMinecraft = (nest: NestInfo) => /minecraft/i.test(nest.name);

const allowValues = (rules: string): string[] => {
    const match = rules.match(/(?:^|\|)in:([^|]+)/);
    return match ? match[1].split(',').map((value) => value.trim()).filter(Boolean) : [];
};

const cpuLabel = (value: number, cores: number): string => {
    if (value >= cores * 100) return vt('Tous les coeurs disponibles');
    if (value % 100 === 0) return vt('{{count}} coeur(s) dédié(s)', { count: value / 100 });
    return vt('Performance partagée');
};

export default function DeployWizard({ hasServers: hasServersProp }: { hasServers?: boolean }) {
    const user = useStoreState((state) => state.user.data!);
    const isAdmin = !!user?.rootAdmin;
    const dismissKey = `vinus:deploy:prompt:${user?.uuid || 'anon'}`;

    const [promptVisible, setPromptVisible] = useState(false);
    const [promptLeaving, setPromptLeaving] = useState(false);
    const [promptMessage, setPromptMessage] = useState<string>('');
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<DeployData | null>(null);
    const [dataError, setDataError] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [known, setKnown] = useState(hasServersProp !== undefined);
    const [ownHasServers, setOwnHasServers] = useState(false);
    const hasServers = hasServersProp !== undefined ? hasServersProp : ownHasServers;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [ownerId, setOwnerId] = useState<number>(0);
    const [memory, setMemory] = useState(0);
    const [cpu, setCpu] = useState(0);
    const [disk, setDisk] = useState(0);
    const [nodeId, setNodeId] = useState(0);
    const [allocationId, setAllocationId] = useState(0);
    const [eggId, setEggId] = useState(0);
    const [versionEnv, setVersionEnv] = useState<string>('');
    const [versionValue, setVersionValue] = useState<string>('');
    const [buildValue, setBuildValue] = useState<string>('');

    useEffect(() => {
        if (!isAdmin) return;
        if (hasServersProp !== undefined) return;
        let cancelled = false;
        getServers({ page: 1 })
            .then((result) => { if (!cancelled) { setOwnHasServers(result.pagination.total > 0); setKnown(true); } })
            .catch(() => { if (!cancelled) setKnown(true); });
        return () => { cancelled = true; };
    }, [isAdmin, hasServersProp]);

    useEffect(() => {
        if (!isAdmin || !known || hasServers) return;
        let abandoned = false;
        try { abandoned = window.localStorage.getItem(ABANDONED_KEY) === '1'; } catch { /* noop */ }
        if (abandoned) {
            try { window.localStorage.removeItem(ABANDONED_KEY); } catch { /* noop */ }
            setPromptMessage(vt('Oups, vous n\u2019avez pas encore créé votre premier serveur.'));
            setPromptVisible(true);
            return;
        }
        try {
            if (!window.localStorage.getItem(dismissKey)) setPromptVisible(true);
        } catch {
            setPromptVisible(true);
        }
    }, [isAdmin, known, hasServers, dismissKey]);

    const dismiss = useCallback(() => {
        try {
            window.localStorage.setItem(dismissKey, '1');
            window.localStorage.setItem(ABANDONED_KEY, '1');
        } catch { /* noop */ }
        setPromptLeaving(true);
        window.setTimeout(() => setPromptVisible(false), 260);
    }, [dismissKey]);

    const applyEgg = useCallback((item: EggInfo) => {
        setEggId(item.id);
        const variable = item.variables.find((entry) => /version/i.test(entry.env_variable));
        const versions = item.versions || [];
        const preferred = versions.find((entry) => entry.supported) || versions[0];
        setVersionEnv(variable?.env_variable || '');
        setVersionValue(preferred ? preferred.id : (variable?.default_value || ''));
    }, []);

    const load = useCallback(async () => {
        setMessage(null);
        setDataError(null);
        try {
            const response = await fetch('/admin/vinus-deploy/data', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) throw new Error(`${response.status}`);
            const payload: DeployData = await response.json();
            setData(payload);

            const node = payload.nodes[0];
            if (node) {
                setNodeId(node.id);
                setAllocationId(node.allocations[0]?.id || 0);
                const lastMem = node.memory_presets[node.memory_presets.length - 1];
                setMemory(node.memory_presets.find((preset) => preset.value >= 4096)?.value ?? lastMem?.value ?? 1024);
                const lastCpu = node.cpu_presets[node.cpu_presets.length - 1];
                setCpu(lastCpu ?? node.cpu_cores * 100);
                setDisk(Math.min(10240, node.disk));
            }
            setOwnerId(user?.id || payload.users[0]?.id || 0);
            const egg = payload.nests[0]?.eggs[0];
            if (egg) applyEgg(egg);
        } catch {
            setDataError(vt('Impossible de charger les données de déploiement.'));
        }
    }, [user, applyEgg]);

    const openWizard = useCallback(() => {
        try {
            window.localStorage.removeItem(ABANDONED_KEY);
            window.localStorage.removeItem(STORE_KEY);
        } catch { /* noop */ }
        setPromptMessage('');
        dismiss();
        setStep(0);
        setOpen(true);
        if (!data) void load();
    }, [data, dismiss, load]);

    const node = useMemo(() => data?.nodes.find((item) => item.id === nodeId) || data?.nodes[0], [data, nodeId]);
    const egg = useMemo(() => {
        for (const nest of data?.nests || []) {
            const found = nest.eggs.find((item) => item.id === eggId);
            if (found) return found;
        }
        return undefined;
    }, [data, eggId]);
    const nestOfEgg = useMemo(() => data?.nests.find((nest) => nest.eggs.some((item) => item.id === eggId)), [data, eggId]);
    const versionOptions = useMemo(() => allowValues(egg?.variables.find((variable) => variable.env_variable === versionEnv)?.rules || ''), [egg, versionEnv]);
    const catalogVersions = useMemo(() => egg?.versions || [], [egg]);
    const catalogBuilds = useMemo(() => egg?.builds || [], [egg]);
    const allocation = useMemo(() => node?.allocations.find((item) => item.id === allocationId), [node, allocationId]);

    useEffect(() => {
        if (!isAdmin || !known || hasServers) {
            try { window.localStorage.removeItem(ABANDONED_KEY); window.localStorage.removeItem(STORE_KEY); } catch { /* noop */ }
            return;
        }
        const onLeave = () => {
            try {
                if (open) { window.localStorage.setItem(STORE_KEY, '1'); return; }
                if (promptVisible && !promptLeaving) window.localStorage.setItem(ABANDONED_KEY, '1');
            } catch { /* noop */ }
        };
        window.addEventListener('pagehide', onLeave);
        window.addEventListener('beforeunload', onLeave);
        return () => {
            window.removeEventListener('pagehide', onLeave);
            window.removeEventListener('beforeunload', onLeave);
        };
    }, [isAdmin, known, hasServers, open, promptVisible, promptLeaving]);

    useEffect(() => {
        if (!node) return;
        if (!node.memory_presets.some((preset) => preset.value === memory)) {
            const lastMem = node.memory_presets[node.memory_presets.length - 1];
            setMemory(lastMem?.value ?? 1024);
        }
        if (node && !node.cpu_presets.includes(cpu)) {
            const lastCpu = node.cpu_presets[node.cpu_presets.length - 1];
            setCpu(lastCpu ?? node.cpu_cores * 100);
        }
        if (node && disk > node.disk) setDisk(node.disk);
    }, [node, memory, cpu, disk]);

    useEffect(() => {
        if (!versionEnv || !catalogVersions.length) return;
        if (catalogVersions.some((entry) => entry.id === versionValue)) return;
        const preferred = catalogVersions.find((entry) => entry.supported) || catalogVersions[0];
        setVersionValue(preferred ? preferred.id : '');
    }, [versionEnv, catalogVersions, versionValue]);

    useEffect(() => {
        if (!catalogBuilds.length) { setBuildValue(''); return; }
        if (catalogBuilds.some((entry) => entry.id === buildValue)) return;
        setBuildValue(String(catalogBuilds[0].id));
    }, [catalogBuilds, buildValue]);

    const canNext = (): boolean => {
        if (step === 0) return name.trim().length > 0 && ownerId > 0;
        if (step === 1) return memory > 0 && cpu > 0 && disk >= 128;
        if (step === 2) return allocationId > 0;
        if (step === 3) return eggId > 0;
        return true;
    };

    const submit = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const body: Record<string, unknown> = {
                name: name.trim(),
                description: description.trim(),
                owner_id: ownerId,
                egg_id: eggId,
                allocation_id: allocationId,
                memory,
                disk,
                cpu,
                start_on_completion: false,
            };
            if (versionEnv && versionValue) {
                const environment: Record<string, string> = { [versionEnv]: versionValue };
                const buildVariable = egg?.variables.find((entry) => /build|loader|forge|fabric/i.test(entry.env_variable) && entry.env_variable !== versionEnv);
                if (buildVariable && buildValue) environment[buildVariable.env_variable] = buildValue;
                body.environment = environment;
            }
            const response = await fetch('/admin/vinus-deploy', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf(),
                },
                body: JSON.stringify(body),
            });
            const payload = await response.json().catch(() => ({}));
            if (!response.ok) {
                setMessage(payload?.message || vt('La création a échoué.'));
                setBusy(false);
                return;
            }
            window.location.href = `/server/${payload.server.identifier}`;
            try { window.localStorage.removeItem(ABANDONED_KEY); window.localStorage.removeItem(STORE_KEY); window.localStorage.setItem(dismissKey, '1'); } catch { /* noop */ }
        } catch {
            setMessage(vt('La création a échoué.'));
            setBusy(false);
        }
    };

    if (!isAdmin) return null;

    if (promptVisible && !open) {
        return (
            <div className={`${styles.overlay} ${promptLeaving ? styles.overlayOut : styles.overlayIn}`} role="dialog" aria-modal="true" aria-label={vt('Créer un serveur')}>
                <div className={`${styles.prompt} ${promptLeaving ? styles.cardOut : styles.cardIn}`}>
                    <span className={styles.badge}>{promptMessage ? vt('Rappel') : vt('Première connexion')}</span>
                    {promptMessage && <p className={styles.oups}>{promptMessage}</p>}
                    <h2>{vt('Voulez-vous créer un serveur maintenant ?')}</h2>
                    {!promptMessage && <p>{vt('Un assistant vous guide en cinq étapes : identité, ressources, accès, logiciel et récapitulatif.')}</p>}
                    <div className={styles.actions}>
                        <button type="button" className={styles.ghost} onClick={dismiss}>{vt('Plus tard')}</button>
                        <button type="button" className={styles.primary} onClick={openWizard}>{vt('Créer un serveur')}</button>
                    </div>
                </div>
            </div>
        );
    }

    if (!open) return null;

    return (
        <div className={`${styles.overlay} ${styles.overlayIn}`} role="dialog" aria-modal="true" aria-label={vt('Assistant de création')}>
            <div className={`${styles.shell} ${styles.cardIn}`}>
                <header className={styles.head}>
                    <div>
                        <span className={styles.badge}>{vt('DÉPLOYER UNE INSTANCE')}</span>
                        <h2>{vt('Assistant de création')}</h2>
                    </div>
                    <button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label={vt('Fermer')}>×</button>
                </header>

                <ol className={styles.steps}>
                    {STEPS.map((label, index) => (
                        <li key={label} data-state={index === step ? 'current' : index < step ? 'done' : 'todo'}>
                            <span>{index < step ? '✓' : String(index + 1).padStart(2, '0')}</span>
                            <small>{label}</small>
                        </li>
                    ))}
                </ol>

                <div className={styles.body} key={step}>
                    {dataError && <p className={styles.error}>{dataError}</p>}
                    {!data && !dataError && <p className={styles.muted}>{vt('Chargement…')}</p>}

                    {data && step === 0 && (
                        <section className={`${styles.panel} ${styles.panelIn}`}>
                            <h3>{vt('Identité')}</h3>
                            <label>{vt('Nom du serveur')}
                                <input value={name} maxLength={191} onChange={(event) => setName(event.target.value)} placeholder="mon-serveur" />
                            </label>
                            <label>{vt('Description (optionnel)')}
                                <input value={description} maxLength={191} onChange={(event) => setDescription(event.target.value)} />
                            </label>
                            <label>{vt('Propriétaire')}
                                <select value={ownerId} onChange={(event) => setOwnerId(Number(event.target.value))}>
                                    {data.users.map((item) => <option key={item.id} value={item.id}>{item.username} ({item.email})</option>)}
                                </select>
                            </label>
                        </section>
                    )}

                    {data && step === 1 && (
                        <section className={`${styles.panel} ${styles.panelIn}`}>
                            <h3>{vt('Ressources')}</h3>
                            <p className={styles.label}>{vt('Allocation de RAM')} <em className={styles.hint}>{node && vt('· {{total}} Go disponibles sur ce nœud', { total: Math.floor(node.memory / 1024) })}</em></p>
                            <div className={styles.memoryGrid}>
                                {(node?.memory_presets || []).map((preset, index) => (
                                    <button key={preset.value} type="button" className={styles.memoryCard} style={{ animationDelay: `${index * 45}ms` }} data-active={memory === preset.value} onClick={() => setMemory(preset.value)}>
                                        <strong>{preset.value / 1024}<em>GB</em></strong>
                                        <small>{preset.label}</small>
                                    </button>
                                ))}
                            </div>
                            <p className={styles.label}>{vt('Limite CPU')} <em className={styles.hint}>{node && vt('· {{cores}} cœur(s) sur ce nœud', { cores: node.cpu_cores })}</em></p>
                            <div className={styles.memoryGrid}>
                                {(node?.cpu_presets || []).map((value, index) => (
                                    <button key={value} type="button" className={styles.memoryCard} style={{ animationDelay: `${index * 45}ms` }} data-active={cpu === value} onClick={() => setCpu(value)}>
                                        <strong>{value}<em>%</em></strong>
                                        <small>{cpuLabel(value, node?.cpu_cores || 1)}</small>
                                    </button>
                                ))}
                            </div>
                            <div className={styles.twoCols}>
                                <label>{vt('Disque (MB)')}
                                    <input type="number" min={128} max={node?.disk || undefined} value={disk} onChange={(event) => setDisk(Number(event.target.value))} />
                                </label>
                                <div className={styles.autoBox}>
                                    <strong>{vt('Auto-optimisé')}</strong>
                                    <button type="button" className={styles.autoButton} onClick={() => {
                                        if (!node) return;
                                        const mid = node.memory_presets[Math.max(0, Math.floor(node.memory_presets.length / 2))];
                                        setMemory(mid?.value ?? node.memory);
                                        setDisk(Math.min(10240, node.disk));
                                        setCpu(node.cpu_presets[node.cpu_presets.length - 1] ?? node.cpu_cores * 100);
                                    }}>{vt('⚡ AUTO')}</button>
                                    <small>{node && vt('Ajusté pour ce nœud')}</small>
                                </div>
                            </div>
                        </section>
                    )}

                    {data && step === 2 && (
                        <section className={`${styles.panel} ${styles.panelIn}`}>
                            <h3>{vt('Réseau & accès')}</h3>
                            {data.nodes.length > 1 && (
                                <label>{vt('Nœud')}
                                    <select value={nodeId} onChange={(event) => { const id = Number(event.target.value); setNodeId(id); setAllocationId(data.nodes.find((item) => item.id === id)?.allocations[0]?.id || 0); }}>
                                        {data.nodes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                                    </select>
                                </label>
                            )}
                            <label>{vt('Port du serveur')}
                                <select value={allocationId} onChange={(event) => setAllocationId(Number(event.target.value))}>
                                    {(node?.allocations || []).map((item) => <option key={item.id} value={item.id}>{item.port} — {item.ip}</option>)}
                                </select>
                            </label>
                            {allocation?.alias && <p className={styles.muted}>{vt('Alias IP')} : {allocation.alias}</p>}
                            <p className={styles.muted}>{vt('{count} ports disponibles', { count: node?.allocations.length || 0 })}</p>
                        </section>
                    )}

                    {data && step === 3 && (
                        <section className={`${styles.panel} ${styles.panelIn}`}>
                            <h3>{vt('Logiciel')}</h3>
                            {data.nests.map((nest, nestIndex) => (
                                <div key={nest.id} className={styles.nestBlock}>
                                    <p className={styles.label}>{isMinecraft(nest) ? vt('Serveur Minecraft') : nest.name}</p>
                                    <div className={styles.engineGrid}>
                                        {nest.eggs.map((item, eggIndex) => (
                                            <button key={item.id} type="button" className={styles.engineCard} style={{ animationDelay: `${(nestIndex * 3 + eggIndex) * 45}ms` }} data-active={eggId === item.id} onClick={() => applyEgg(item)}>
                                                <strong>{item.name}</strong>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {versionEnv && catalogVersions.length > 0 && (
                                <div className={styles.picker}>
                                    <p className={styles.pickerLabel}>{vt('Version de Minecraft')}</p>
                                    <div className={styles.optionScroll}>
                                        {catalogVersions.map((entry, index) => (
                                            <button key={entry.id} type="button" style={{ animationDelay: `${Math.min(index, 20) * 25}ms` }} className={styles.optionRow} data-active={versionValue === entry.id} onClick={() => setVersionValue(entry.id)}>
                                                <strong>{entry.id}</strong>
                                                <span>{entry.channel && entry.channel !== 'RELEASE' ? entry.channel : vt('Stable')}{entry.supported ? '' : ` · ${vt('non pris en charge')}`}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {versionEnv && catalogBuilds.length > 0 && (
                                <div className={styles.picker}>
                                    <p className={styles.pickerLabel}>{vt('Version du loader')}</p>
                                    <div className={styles.optionScroll}>
                                        {catalogBuilds.map((entry, index) => (
                                            <button key={entry.id} type="button" style={{ animationDelay: `${Math.min(index, 20) * 25}ms` }} className={styles.optionRow} data-active={buildValue === entry.id} onClick={() => setBuildValue(String(entry.id))}>
                                                <strong>{entry.name}</strong>
                                                <span>{entry.experimental ? vt('Expérimental') : vt('Stable')}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {versionEnv && catalogVersions.length === 0 && versionOptions.length > 0 && (
                                <label>{vt('Version')}
                                    <select value={versionValue} onChange={(event) => setVersionValue(event.target.value)}>
                                        {versionOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                                    </select>
                                </label>
                            )}
                            {versionEnv && catalogVersions.length === 0 && versionOptions.length === 0 && (
                                <p className={styles.muted}>{vt('Version par défaut du logiciel.')}</p>
                            )}
                        </section>
                    )}

                    {data && step === 4 && (
                        <section className={`${styles.panel} ${styles.panelIn}`}>
                            <h3>{vt('Récapitulatif')}</h3>
                            <ul className={styles.summary}>
                                <li style={{ animationDelay: '0ms' }}><span>{vt('Nom')}</span><strong>{name || '—'}</strong></li>
                                <li style={{ animationDelay: '55ms' }}><span>{vt('Propriétaire')}</span><strong>{data.users.find((item) => item.id === ownerId)?.username || '—'}</strong></li>
                                <li style={{ animationDelay: '110ms' }}><span>{vt('Ressources')}</span><strong>{memory / 1024} GB · {cpu}% · {disk} MB</strong></li>
                                <li style={{ animationDelay: '165ms' }}><span>{vt('Nœud')}</span><strong>{node?.name || '—'}</strong></li>
                                <li style={{ animationDelay: '220ms' }}><span>{vt('Port')}</span><strong>{allocation?.port || '—'}</strong></li>
                                <li style={{ animationDelay: '275ms' }}><span>{vt('Logiciel')}</span><strong>{nestOfEgg?.name || '—'} · {egg?.name || '—'}</strong></li>
                                {versionEnv && versionValue && <li style={{ animationDelay: '330ms' }}><span>{vt('Version')}</span><strong>{versionValue}{buildValue ? ` · ${buildValue}` : ''}</strong></li>}
                            </ul>
                            {message && <p className={styles.error}>{message}</p>}
                        </section>
                    )}
                </div>

                <footer className={styles.foot}>
                    <button type="button" className={styles.ghost} disabled={step === 0 || busy} onClick={() => setStep((value) => Math.max(0, value - 1))}>← {vt('Retour')}</button>
                    <span className={styles.counter}>{vt('Étape')} {step + 1} / {STEPS.length}</span>
                    {step < STEPS.length - 1
                        ? <button type="button" className={styles.primary} disabled={!canNext()} onClick={() => setStep((value) => value + 1)}>{vt('Suivant')} →</button>
                        : <button type="button" className={styles.primary} disabled={busy} onClick={submit}>{busy ? vt('Création…') : vt('Créer le serveur')}</button>}
                </footer>
            </div>
        </div>
    );
}
