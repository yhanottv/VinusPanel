import MessageBox from '@/components/MessageBox';
import { useDesign, useDesignPreview, designPreview } from '@/designRuntime';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import NavigationBar from '@/components/NavigationBar';
import SearchContainer from '@/components/dashboard/search/SearchContainer';
import Icon from './DashboardIcon';
import styles from './dashboard.module.css';
import { vt } from '@/locales/translate';
import LanguageSelector from '@/components/elements/LanguageSelector';
import { usePersistedState } from '@/plugins/usePersistedState';
import http from '@/api/http';
import { VINUS } from '@/theme';
import DeployWizard from './deploy/DeployWizard';

export default function DashboardShell({ children, sidebar }: { children: React.ReactNode; sidebar?: React.ReactNode }) {
    const design = useDesign();
    const user = useStoreState(state => state.user.data!);
    useDesignPreview(user.rootAdmin);
    const [light, setLight] = usePersistedState(`${user.uuid}:dashboard:light`, false);
    const [previewLight,setPreviewLight]=useState(false);
    useEffect(()=>{const update=(e:Event)=>setPreviewLight((e as CustomEvent<boolean>).detail);window.addEventListener('vinus:preview-theme',update);return()=>window.removeEventListener('vinus:preview-theme',update);},[]);
    const [accent, setAccent] = usePersistedState(`${user.uuid}:dashboard:accent`, '');
    const [menu, setMenu] = useState<'help' | 'color' | null>(null);
    const [mobileActions, setMobileActions] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);
    const [error, setError] = useState('');
    const actions = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement | null>(null);
    useEffect(() => {
        if (!menu && !mobileActions) return;
        const outside = (event: MouseEvent) => {
            if (!actions.current?.contains(event.target as Node)) setMenu(null);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') { setMenu(null); setMobileActions(false); trigger.current?.focus(); }
        };
        document.addEventListener('mousedown', outside);
        document.addEventListener('keydown', escape);
        return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', escape); };
    }, [menu, mobileActions]);
    const toggle = (value: 'help' | 'color', target: HTMLButtonElement) => {
        trigger.current = target; setMenu(current => current === value ? null : value);
    };
    const logout = async () => {
        setLoggingOut(true); setError('');
        try { await http.post('/auth/logout'); window.location.assign('/auth/login'); }
        catch { setError(vt('Déconnexion impossible. Réessayez.')); setLoggingOut(false); }
    };
    const validAccent = !designPreview && design.options.palette_picker && /^#[\da-f]{6}$/i.test(accent || '') ? accent : '';
    const colorStyle = validAccent ? {
        '--dash-accent': validAccent,
        '--dash-accent-rgb': [1, 3, 5].map(index => parseInt(validAccent.slice(index, index + 2), 16)).join(','),
    } as React.CSSProperties : undefined;
    return <div className={`${styles.shell} app-shell`} data-theme={(designPreview ? previewLight : light) ? 'light' : 'dark'} style={colorStyle} data-vinus-shell="true">
        <a className="skip-navigation" href="#main-content">{vt('Aller au contenu')}</a>
        {sidebar || <NavigationBar />}
        <main className={`${styles.workspace} app-workspace`} id="main-content" tabIndex={-1}>
            <header className={styles.topbar}>
                <div className={styles.search}><SearchContainer /></div>
                <button type="button" className={styles.mobileSettings} aria-label={vt('Options du dashboard')} aria-expanded={mobileActions} aria-controls="dashboard-actions" onClick={event => { trigger.current = event.currentTarget; setMobileActions(!mobileActions); }}><Icon name="controls" /></button>
                <div className={styles.actions} id="dashboard-actions" data-open={mobileActions} ref={actions} onBlur={event => {
                    if (!event.currentTarget.contains(event.relatedTarget as Node)) setMenu(null);
                }}>
                    <div className={styles.popover}>
                        <button className={styles.pillButton} type="button" aria-label={vt('Assistance')} aria-expanded={menu === 'help'} aria-controls="dashboard-help" onClick={e => toggle('help', e.currentTarget)}>
                            <Icon name="help" /><span>{vt('Assistance')}</span><Icon name="down" />
                        </button>
                        {menu === 'help' && <div className={styles.popoverPanel} id="dashboard-help">
                            {VINUS.discordInvite && <a href={VINUS.discordInvite} target="_blank" rel="noreferrer"><Icon name="discord" />Discord</a>}
                            <a href="https://github.com/yhanottv/VinusPanel#support" target="_blank" rel="noreferrer"><Icon name="help" />{vt('Documentation et support')}</a>
                            <Link to="/account" onClick={() => setMenu(null)}><Icon name="user" />{vt('Mon compte')}</Link>
                        </div>}
                    </div>
                    <LanguageSelector compact />
                    <div className={styles.popover}>
                        <button className={styles.roundButton} type="button" title={vt('Couleur')} aria-label={vt('Couleur')} aria-expanded={menu === 'color'} aria-controls="dashboard-palette" onClick={e => toggle('color', e.currentTarget)}><Icon name="palette" /></button>
                        {menu === 'color' && <div className={styles.popoverPanel} id="dashboard-palette">
                            <p className={styles.paletteTitle}>{vt('Couleur de votre interface')}</p>
                            <div className={styles.swatches}>{[['#49a6e9','Bleu'], ['#a78bfa','Violet'], ['#43d6a3','Vert'], ['#ff9b52','Orange']].map(([color,label]) => <button type="button" key={color} aria-label={vt(label)} aria-pressed={accent === color} style={{backgroundColor: color}} onClick={() => setAccent(color)}>{accent === color && <Icon name="check" />}</button>)}</div>
                            <button type="button" className={styles.resetColor} onClick={() => setAccent('')}>{vt('Couleur du panel')}</button>
                        </div>}
                    </div>
                    <button className={styles.roundButton} type="button" aria-label={vt(light ? 'Passer au thème sombre' : 'Passer au thème clair')} title={vt(light ? 'Passer au thème sombre' : 'Passer au thème clair')} onClick={() => { setLight(!light); setMenu(null); }}><Icon name={light ? 'moon' : 'sun'} /></button>
                    {user.rootAdmin && <Link className={`${styles.roundButton} ${styles.designButton}`} to="/design" aria-label={vt('Modifier le thème')} title={vt('Modifier le thème')}><Icon name="brush" /></Link>}
                    <button className={`${styles.roundButton} ${styles.logoutButton}`} type="button" aria-label={vt('Déconnexion')} title={vt('Déconnexion')} disabled={loggingOut} onClick={logout}><Icon name="logout" /></button>
                </div>
            </header>
            {error && <MessageBox type="error" dismissible key={error}>{error}</MessageBox>}
            {children}
            {user.rootAdmin && <DeployWizard />}
        </main>
    </div>;
}
