import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { vt } from '@/locales/translate';
import styles from './deploy.module.css';

const csrf = () => document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content || '';

interface AllocationInfo { id: number; ip: string; port: number; alias: string | null }
interface NodeInfo {
    id: number; name: string; fqdn: string;
    memory: number; disk: number; memory_overallocate: number; disk_overallocate: number;
    allocations: AllocationInfo[];
}
interface VariableInfo { env_variable: string; name: string; default_value: string; rules: string }
interface EggInfo { id: number; name: string; startup: string; images: string[]; variables: VariableInfo[] }
interface NestInfo { id: number; name: string; eggs: EggInfo[] }
interface UserInfo { id: number; email: string; username: string }
interface DeployData { nodes: NodeInfo[]; nests: NestInfo[]; users: UserInfo[] }

const MEMORY_CHOICES: Array<[number, string]> = [
    [1024, 'Small Testing Server'],
    [2048, 'Small Testing Server'],
    [4096, 'Starter Survival'],
    [8192, 'Medium Survival Server'],
    [16384, 'Large Community Server'],
    [24576, 'Heavy Modpack Server'],
    [32768, 'High-Traffic Network'],
    [49152, 'Enterprise Workload'],
    [65536, 'Extreme Performance'],
];

const STEPS = ['IDENTITY', 'RESOURCES', 'ACCESS', 'SOFTWARE', 'REVIEW'] as const;

const isMinecraft = (nest: NestInfo) => /minecraft/i.test(nest.name);

const allowValues = (rules: string): string[] => {
    const match = rules.match(/(?:^|\|)in:([^|]+)/);
    return match ? match[1].split(',').map((value) => value.trim()).filter(Boolean) : [];
};

export default function DeployWizard({ hasServers }: { hasServers: boolean }) {
    const user = useStoreState((state) => state.user.data!);
    const isAdmin = !!user?.rootAdmin;
    const dismissKey = `vinus:deploy:prompt:${user?.uuid || 'anon'}`;

    const [promptVisible, setPromptVisible] = useState(false);
    const [open, setOpen] = useState(false);
    const [data, setData] = useState<DeployData | null>(null);
    const [dataError, setDataError] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [ownerId, setOwnerId] = useState<number>(0);
    const [memory, setMemory] = useState(4096);
    const [cpu, setCpu] = useState(150);
    const [disk, setDisk] = useState(10240);
    const [nodeId, setNodeId] = useState(0);
    const [allocationId, setAllocationId] = useState(0);
    const [eggId, setEggId] = useState(0);
    const [versionEnv, setVersionEnv] = useState<string>('');
    const [versionValue, setVersionValue] = useState<string>('');

    useEffect(() => {
        if (!isAdmin || hasServers) return;
        try {
            if (!window.localStorage.getItem(dismissKey)) setPromptVisible(true);
        } catch {
            setPromptVisible(true);
        }
    }, [isAdmin, hasServers, dismissKey]);

    const dismiss = useCallback(() => {
        try { window.localStorage.setItem(dismissKey, '1'); } catch { /* ignore */ }
        setPromptVisible(false);
    }, [dismissKey]);

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
            }
            setOwnerId(user?.id || payload.users[0]?.id || 0);
            const egg = payload.nests[0]?.eggs[0];
            if (egg) {
                setEggId(egg.id);
                const version = egg.variables.find((variable) => /version/i.test(variable.env_variable));
                setVersionEnv(version?.env_variable || '');
                setVersionValue(version?.default_value || '');
            }
        } catch {
            setDataError(vt('Impossible de charger les données de déploiement.'));
        }
    }, [user]);

    const openWizard = useCallback(() => {
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
    const versionRules = useMemo(() => egg?.variables.find((variable) => variable.env_variable === versionEnv)?.rules || '', [egg, versionEnv]);
    const versionOptions = useMemo(() => allowValues(versionRules), [versionRules]);
    const allocation = useMemo(() => node?.allocations.find((item) => item.id === allocationId), [node, allocationId]);

    const canNext = (): boolean => {
        if (step === 0) return name.trim().length > 0 && ownerId > 0;
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
            if (versionEnv) body.environment = { [versionEnv]: versionValue };
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
        } catch {
            setMessage(vt('La création a échoué.'));
            setBusy(false);
        }
    };

    if (!isAdmin) return null;

    if (promptVisible && !open) {
        return (
            <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={vt('Créer un serveur')}>
                <div className={styles.prompt}>
                    <span className={styles.badge}>{vt('Première connexion')}</span>
                    <h2>{vt('Voulez-vous créer un serveur maintenant ?')}</h2>
                    <p>{vt('Un assistant vous guide en cinq étapes : identité, ressources, accès, logiciel et récapitulatif.')}</p>
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
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={vt('Assistant de création')}>
            <div className={styles.shell}>
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

                <div className={styles.body}>
                    {dataError && <p className={styles.error}>{dataError}</p>}
                    {!data && !dataError && <p className={styles.muted}>{vt('Chargement…')}</p>}

                    {data && step === 0 && (
                        <section className={styles.panel}>
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
                        <section className={styles.panel}>
                            <h3>{vt('Ressources')}</h3>
                            <p className={styles.label}>{vt('Allocation de RAM')}</p>
                            <div className={styles.memoryGrid}>
                                {MEMORY_CHOICES.map(([value, hint]) => (
                                    <button key={value} type="button" className={styles.memoryCard} data-active={memory === value} onClick={() => setMemory(value)}>
                                        <strong>{value / 1024}<em>GB</em></strong>
                                        <small>{hint}</small>
                                    </button>
                                ))}
                            </div>
                            <div className={styles.twoCols}>
                                <label>{vt('Limite CPU (%)')}
                                    <input type="number" min={0} max={2000} value={cpu} onChange={(event) => setCpu(Number(event.target.value))} />
                                </label>
                                <label>{vt('Disque (MB)')}
                                    <input type="number" min={128} value={disk} onChange={(event) => setDisk(Number(event.target.value))} />
                                </label>
                            </div>
                            {node && <p className={styles.muted}>{vt('Nœud')} : {node.name} · {node.memory} MB RAM · {node.disk} MB disque</p>}
                        </section>
                    )}

                    {data && step === 2 && (
                        <section className={styles.panel}>
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
                        <section className={styles.panel}>
                            <h3>{vt('Logiciel')}</h3>
                            {data.nests.map((nest) => (
                                <div key={nest.id} className={styles.nestBlock}>
                                    <p className={styles.label}>{isMinecraft(nest) ? vt('Serveur Minecraft') : nest.name}</p>
                                    <div className={styles.engineGrid}>
                                        {nest.eggs.map((item) => (
                                            <button key={item.id} type="button" className={styles.engineCard} data-active={eggId === item.id} onClick={() => {
                                                setEggId(item.id);
                                                const version = item.variables.find((variable) => /version/i.test(variable.env_variable));
                                                setVersionEnv(version?.env_variable || '');
                                                setVersionValue(version?.default_value || '');
                                            }}>
                                                <strong>{item.name}</strong>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {versionEnv && (
                                <label>{vt('Version')}
                                    {versionOptions.length ? (
                                        <select value={versionValue} onChange={(event) => setVersionValue(event.target.value)}>
                                            {versionOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                                        </select>
                                    ) : (
                                        <input value={versionValue} onChange={(event) => setVersionValue(event.target.value)} />
                                    )}
                                </label>
                            )}
                        </section>
                    )}

                    {data && step === 4 && (
                        <section className={styles.panel}>
                            <h3>{vt('Récapitulatif')}</h3>
                            <ul className={styles.summary}>
                                <li><span>{vt('Nom')}</span><strong>{name || '—'}</strong></li>
                                <li><span>{vt('Propriétaire')}</span><strong>{data.users.find((item) => item.id === ownerId)?.username || '—'}</strong></li>
                                <li><span>{vt('Ressources')}</span><strong>{memory / 1024} GB · {cpu}% · {disk} MB</strong></li>
                                <li><span>{vt('Nœud')}</span><strong>{node?.name || '—'}</strong></li>
                                <li><span>{vt('Port')}</span><strong>{allocation?.port || '—'}</strong></li>
                                <li><span>{vt('Logiciel')}</span><strong>{nestOfEgg?.name || '—'} · {egg?.name || '—'}</strong></li>
                                {versionEnv && <li><span>{vt('Version')}</span><strong>{versionValue}</strong></li>}
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
