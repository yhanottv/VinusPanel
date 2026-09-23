import BeforeNavigation from '@blueprint/components/Navigation/NavigationBar/BeforeNavigation';
import AdditionalItems from '@blueprint/components/Navigation/NavigationBar/AdditionalItems';
import AfterNavigation from '@blueprint/components/Navigation/NavigationBar/AfterNavigation';
import BeforeSubNavigation from '@blueprint/components/Navigation/SubNavigation/BeforeSubNavigation';
import AdditionalAccountItems from '@blueprint/components/Navigation/SubNavigation/AdditionalAccountItems';
import AfterSubNavigation from '@blueprint/components/Navigation/SubNavigation/AfterSubNavigation';
import blueprintRoutes from '@blueprint/extends/routers/routes';
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import Avatar from '@/components/Avatar';
import useProfileAppearance from '@/components/dashboard/profile/useProfileAppearance';
import { VINUS } from '@/theme';
import { vt } from '@/locales/translate';
import http from '@/api/http';
import Icon from '@/components/dashboard/DashboardIcon';
import styles from '@/components/dashboard/dashboard.module.css';

export default function NavigationBar() {
    const user = useStoreState(state => state.user.data!);
    const { appearance } = useProfileAppearance(user.uuid);
    const location = useLocation();
    const [mobile, setMobile] = useState(false);
    const [account, setAccount] = useState(true);
    const [links, setLinks] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [brand, setBrand] = useState({ name: VINUS.name, logo: VINUS.logo });
    useEffect(() => { setMobile(false); }, [location.pathname]);
    useEffect(() => {
        const update = (event: Event) => {
            const detail = (event as CustomEvent<{name: string; logo: string}>).detail;
            if (detail) setBrand(detail);
        };
        window.addEventListener('vinus:design-preview', update);
        return () => window.removeEventListener('vinus:design-preview', update);
    }, []);
    const logout = async () => {
        setBusy(true); setError('');
        try { await http.post('/auth/logout'); window.location.assign('/auth/login'); }
        catch { setError(vt('Déconnexion impossible. Réessayez.')); setBusy(false); }
    };
    return <aside className={styles.sidebar} data-open={mobile}>
        <BeforeNavigation />
        <Link className={styles.brand} to="/" aria-label={brand.name}><img src={brand.logo} alt="" /><strong>{brand.name}</strong></Link>
        <button className={styles.mobileToggle} type="button" aria-label={vt(mobile ? 'Fermer le menu' : 'Ouvrir le menu')} aria-expanded={mobile} aria-controls="panel-navigation" onClick={() => setMobile(!mobile)}><Icon name={mobile ? 'close' : 'menu'} /></button>
        <nav className={styles.nav} id="panel-navigation" aria-label={vt('Navigation principale')}>
            <NavLink to="/" exact><Icon name="grid" /><span>{vt('Tableau de bord')}</span></NavLink>
            <button className={styles.sectionToggle} type="button" aria-expanded={account} aria-controls="account-navigation" onClick={() => setAccount(!account)}>{vt('Compte')}<Icon name="down" /></button>
            {account && <div className={styles.navGroup} id="account-navigation">
                <NavLink to="/account" exact><Icon name="user" /><span>{vt('Vue d’ensemble')}</span></NavLink>
                <NavLink to="/account/api"><Icon name="key" /><span>{vt('Identifiants d’API')}</span></NavLink>
                <NavLink to="/account/ssh"><Icon name="terminal" /><span>{vt('Clés SSH')}</span></NavLink>
                <NavLink to="/account/activity"><Icon name="activity" /><span>{vt('Activité')}</span></NavLink>
                <BeforeSubNavigation />
                {blueprintRoutes.account.filter(route => route.name && (!route.adminOnly || user.rootAdmin)).map(route => <NavLink key={route.path} to={`/account/${route.path}`.replace('//', '/')} exact><Icon name="user" /><span>{route.name}</span></NavLink>)}
                <AdditionalAccountItems /><AfterSubNavigation />
            </div>}
            <button className={styles.sectionToggle} type="button" aria-expanded={links} aria-controls="links-navigation" onClick={() => setLinks(!links)}>{vt('Liens')}<Icon name="down" /></button>
            {links && <div className={styles.navGroup} id="links-navigation">
                {VINUS.discordInvite && <a href={VINUS.discordInvite} target="_blank" rel="noreferrer"><Icon name="discord" /><span>Discord</span></a>}
                <NavLink to="/account/profile"><Icon name="user" /><span>{vt('Profil')}</span></NavLink>
                {user.rootAdmin && <NavLink to="/design"><Icon name="brush" /><span>{vt('Design')}</span></NavLink>}
                {user.rootAdmin && <a href="/admin"><Icon name="controls" /><span>{vt('Administration')}</span></a>}
                <a href="https://github.com/yhanottv/VinusPanel" target="_blank" rel="noreferrer"><Icon name="globe" /><span>VinusPanel · GitHub</span></a>
            </div>}
            <AdditionalItems />
        </nav>
        <Link className={styles.profile} to="/account/profile">
            <span className={styles.avatar}><Avatar.User /></span>
            <span><strong>{appearance.displayName || user.username}</strong><small>{user.email}</small></span>
        </Link>
        <button className={styles.standaloneLogout} type="button" onClick={logout} disabled={busy}><Icon name="logout" />{vt('Déconnexion')}</button>
        {error && <p role="alert" className={styles.error}>{error}</p>}
        <AfterNavigation />
    </aside>;
}
