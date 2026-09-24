import { useDesign, designPreview } from '@/designRuntime';
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import useSWR from 'swr';
import { formatDistanceToNow } from 'date-fns';
import { dateLocale } from '@/locales/dates';
import getServers from '@/api/getServers';
import { Server } from '@/api/server/getServer';
import { PaginatedResult } from '@/api/http';
import { useActivityLogs } from '@/api/account/activity';
import { ActivityLog } from '@definitions/user';
import PageContentBlock from '@/components/elements/PageContentBlock';
import Pagination from '@/components/elements/Pagination';
import Spinner from '@/components/elements/Spinner';
import useFlash from '@/plugins/useFlash';
import { usePersistedState } from '@/plugins/usePersistedState';
import useProfileAppearance from '@/components/dashboard/profile/useProfileAppearance';
import { VinusDesignSettings } from '@/vinusDesign';
import { VINUS } from '@/theme';
import { vt } from '@/locales/translate';
import { formatLocale } from '@/locales/preferences';
import ServerRow from './ServerRow';
import Icon from './DashboardIcon';
import styles from './dashboard.module.css';

const activityLabel = (entry: ActivityLog) => {
    if (entry.description) return entry.description;
    const labels: Record<string, string> = {
        'auth:success': vt('Connexion réussie'), 'auth:failed': vt('Connexion refusée'), 'auth:fail': vt('Connexion refusée'),
        'auth:password-reset': vt('Réinitialisation du mot de passe'),
        'account:email.update': vt('Adresse e-mail modifiée'), 'account:password.update': vt('Mot de passe modifié'),
    };
    return labels[entry.event] || entry.event.replace(/[:.]/g, ' · ');
};

export default function DashboardContainer({ preview = false, design }: { preview?: boolean; design?: VinusDesignSettings }) {
    const liveDesign = useDesign();
    design = design || liveDesign;
    const o = design.options;
    const location = useLocation();
    const defaultPage = Number(new URLSearchParams(location.search).get('page') || '1');
    const [page, setPage] = useState(Number.isSafeInteger(defaultPage) && defaultPage > 0 ? defaultPage : 1);
    const [activityPage, setActivityPage] = useState(0);
    const user = useStoreState(state => state.user.data!);
    const { appearance } = useProfileAppearance(user.uuid);
    const { clearFlashes, clearAndAddHttpError } = useFlash();
    const [admin, setAdmin] = usePersistedState(`${user.uuid}:show_all_servers`, false);
    const [view, setView] = usePersistedState<'grid' | 'list'>(`${user.uuid}:vinus_display_v3`, o.server_view as 'grid' | 'list');
    const [dismissed, setDismissed] = usePersistedState(`${user.uuid}:dashboard:welcome`, false);
    const display = (designPreview ? o.server_view : view) === 'grid' ? 'grid' : 'list';
    const { data: servers, error, mutate } = useSWR<PaginatedResult<Server>>(
        ['vinus-dashboard', user.uuid, admin && user.rootAdmin, page],
        () => getServers({ page, type: admin && user.rootAdmin ? 'admin' : undefined })
    );
    const { data: activity, error: activityError, mutate: retryActivity } = useActivityLogs({ page: 1, sorts: { timestamp: -1 } }, { revalidateOnMount: true });
    const activityPages = Math.max(1, Math.ceil((activity?.items.length || 0) / 3));
    const safeActivityPage = Math.min(activityPage, activityPages - 1);
    useEffect(() => {
        if (preview) return;
        const params = new URLSearchParams(location.search);
        if (page > 1) params.set('page', String(page)); else params.delete('page');
        const query = params.toString();
        window.history.replaceState(window.history.state, document.title, `${location.pathname}${query ? '?' + query : ''}${location.hash}`);
    }, [page, preview]);
    useEffect(() => {
        if (servers && servers.pagination.currentPage > 1 && !servers.items.length) setPage(1);
    }, [servers]);
    useEffect(() => {
        if (error) clearAndAddHttpError({key: 'dashboard', error}); else clearFlashes('dashboard');
    }, [error]);
    const visit = <span className={styles.visit}>{vt('Visiter')}<Icon name="chevron" /></span>;
    return <PageContentBlock title={vt(preview ? 'VinusPanel — Design' : 'VinusPanel — Tableau de bord')} className={`${styles.content} vinus-motion-page`} showFlashKey="dashboard">
        {/* BEFORE_CONTENT */}
        <header className={styles.hero}>
            <div><h1>{vt('Bon retour, ')}{appearance.displayName || user.username}</h1><p>{vt('Gérez toutes vos instances ici.')}</p></div>
            {user.rootAdmin && <a className={styles.primaryButton} href="/admin/servers/new" aria-label={vt('Créer un serveur')}><Icon name="plus" /><span>{vt('Créer un serveur')}</span><span className={styles.count}>{servers?.pagination.total ?? '—'}</span></a>}
        </header>
        {o.welcome_notice && (!dismissed || designPreview) && <section className={styles.announcement} aria-label={vt('Bienvenue sur VinusPanel')}>
            <Icon name="info" /><div><strong>{o.notice_title || vt('Bienvenue sur VinusPanel !')}</strong><p>{o.notice_message || vt('Votre panel open source. Tous vos serveurs, au même endroit.')}</p></div>
            <a className={styles.primaryButton} href="https://github.com/yhanottv/VinusPanel" target="_blank" rel="noreferrer">GitHub<Icon name="external" /></a>
            <button type="button" className={styles.dismiss} aria-label={vt('Ignorer')} onClick={() => setDismissed(true)}><Icon name="close" /></button>
        </section>}
        <div className={styles.quickGrid}>
            {design.cards.length ? design.cards.filter(card => card.visible).map((card,index) => <a className={`${styles.quickCard} ${card.featured ? styles.featured : ''}`} key={index} href={card.url}><span>{card.description}</span><strong>{card.label}</strong>{visit}</a>) : <>
            <Link className={`${styles.quickCard} ${styles.featured}`} to="/account/profile"><span>{vt('Votre identité, vos préférences.')}</span><strong>{vt('Mon compte')}</strong>{visit}</Link>
            <a className={styles.quickCard} href={VINUS.discordInvite || 'https://github.com/yhanottv/VinusPanel#support'} target="_blank" rel="noreferrer"><span><Icon name="discord" />{vt('Échangez avec la communauté.')}</span><strong>{VINUS.discordInvite ? 'Discord' : vt('Assistance')}</strong>{visit}</a>
            <a className={styles.quickCard} href="https://github.com/yhanottv/VinusPanel" target="_blank" rel="noreferrer"><span><Icon name="globe" />{vt('Le projet, les nouveautés et le code.')}</span><strong>VinusPanel</strong>{visit}</a>
            <a className={styles.quickCard} href="https://github.com/yhanottv/VinusPanel/issues" target="_blank" rel="noreferrer"><span><Icon name="help" />{vt('Une question ? Besoin d’aide ?')}</span><strong>{vt('Contacter le support')}</strong>{visit}</a>
        </>}
        </div>
        <section aria-labelledby="servers-heading">
            <div className={styles.sectionHeader}>
                <div><h2 id="servers-heading">{vt('Vos serveurs')}</h2><p>{vt('Tout votre hébergement, avec l’utilisation en direct.')}</p></div>
                <div className={styles.serverTools}>
                    {user.rootAdmin && <label className={styles.adminToggle}><input type="checkbox" checked={admin} onChange={event => { setPage(1); setAdmin(event.target.checked); }} />{vt('Vue administrateur')}</label>}
                    <div className={styles.viewSwitch} aria-label={vt('Mode d’affichage')}>
                        <button type="button" aria-label={vt('Afficher les serveurs en liste')} aria-pressed={display === 'list'} onClick={() => setView('list')}><Icon name="list" /></button>
                        <button type="button" aria-label={vt('Afficher les serveurs en grille')} aria-pressed={display === 'grid'} onClick={() => setView('grid')}><Icon name="grid" /></button>
                    </div>
                </div>
            </div>
            {error ? <div className={styles.empty}><p>{vt('Impossible de charger les serveurs.')}</p><button type="button" className={styles.pillButton} onClick={() => mutate()}>{vt('Réessayer')}</button></div>
                : !servers ? <div className={styles.loading}><Spinner centered /></div>
                : <Pagination data={servers} onPageSelect={setPage}>{({items}) => items.length ? <div className={styles.serverGrid} data-view={display}>{items.map(server => <ServerRow key={server.uuid} server={server} view={display} design={design} />)}</div>
                    : <div className={styles.empty}><Icon name="server" /><h2>{vt('Aucun serveur à afficher')}</h2><p>{admin ? vt("Aucun autre serveur n'est disponible dans la vue administrateur.") : vt("Aucun serveur n'est encore associé à votre compte.")}</p></div>}
                </Pagination>}
        </section>
        <section className={styles.activity} aria-labelledby="activity-heading">
            <header><div><h2 id="activity-heading">{vt('Activité récente')}</h2><p>{activity ? vt('{{count}} événements récents', {count: activity.items.length}) : vt('Chargement…')}</p></div><Link to="/account/activity">{vt('Tout voir')}</Link></header>
            {activityError ? <p className={styles.error} role="alert">{vt('Impossible de charger l’activité.')} <button type="button" onClick={() => retryActivity()}>{vt('Réessayer')}</button></p>
                : !activity ? <div className={styles.loading}><Spinner centered /></div>
                : activity.items.length ? <ul>{activity.items.slice(safeActivityPage * 3, safeActivityPage * 3 + 3).map(entry => <li key={entry.id}>
                    <span className={styles.statusDot} /><div><strong>{activityLabel(entry)}</strong><small>{entry.event.split(':')[0]}{entry.relationships.actor ? ` · ${entry.relationships.actor.username}` : ''}</small></div>
                    <time dateTime={entry.timestamp.toISOString()} title={entry.timestamp.toLocaleString(formatLocale)}>{formatDistanceToNow(entry.timestamp, {addSuffix: true, locale: dateLocale})}</time>
                </li>)}</ul> : <p className={styles.loading}>{vt('Aucune activité récente.')}</p>}
            <div className={styles.activityFooter}><span>{vt('Page {{page}} sur {{total}}', {page: safeActivityPage + 1, total: activityPages})}</span><div className={styles.paginationActions}>
                <button type="button" aria-label={vt('Page précédente')} disabled={safeActivityPage === 0 || !!activityError} onClick={() => setActivityPage(safeActivityPage - 1)}><Icon name="chevron" /></button>
                <button type="button" aria-label={vt('Page suivante')} disabled={safeActivityPage >= activityPages - 1 || !!activityError} onClick={() => setActivityPage(safeActivityPage + 1)}><Icon name="chevron" /></button>
            </div></div>
        </section>
        {/* AFTER_CONTENT */}
    </PageContentBlock>;
}
