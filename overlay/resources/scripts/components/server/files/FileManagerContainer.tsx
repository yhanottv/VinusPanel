import { vt } from '@/locales/translate';
import React, { useEffect, useState } from 'react';
import { httpErrorToHuman } from '@/api/http';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from './FileObjectRow';
import FileManagerBreadcrumbs from './FileManagerBreadcrumbs';
import NewDirectoryButton from './NewDirectoryButton';
import { NavLink, useLocation } from 'react-router-dom';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import useFileManagerSWR from '@/plugins/useFileManagerSwr';
import FileManagerStatus from './FileManagerStatus';
import MassActionsBar from './MassActionsBar';
import UploadButton from './UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from './SelectFileCheckbox';
import { hashToPath } from '@/helpers';
import { browseFiles, selectPage, SortKey } from './browse';
import style from './style.module.css';

export default () => {
    const id = ServerContext.useStoreState(state => state.server.data!.id);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSWR();
    const directory = ServerContext.useStoreState(state => state.files.directory);
    const clearFlashes = useStoreActions(actions => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions(actions => actions.files.setDirectory);
    const setSelectedFiles = ServerContext.useStoreActions(actions => actions.files.setSelectedFiles);
    const selected = ServerContext.useStoreState(state => state.files.selectedFiles);
    const [query, setQuery] = useState('');
    const [sort, setSort] = useState<SortKey>('name');
    const [descending, setDescending] = useState(false);
    const [page, setPage] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    useEffect(() => { clearFlashes('files'); setSelectedFiles([]); setDirectory(hashToPath(hash)); setQuery(''); setPage(0); }, [hash]);
    useEffect(() => { mutate(); }, [directory]);
    const filtered = browseFiles(files || [], query, sort, descending);
    const lastPage = Math.max(0, Math.ceil(filtered.length / 100) - 1);
    const currentPage = Math.min(page, lastPage);
    const visible = filtered.slice(currentPage * 100, currentPage * 100 + 100);
    const order = (key: SortKey) => { setDescending(sort === key ? !descending : false); setSort(key); setPage(0); };
    const refresh = async () => { setRefreshing(true); try { await mutate(); } finally { setRefreshing(false); } };
    if (error) return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    return <ServerContentBlock title={'File Manager'} showFlashKey="files">
        {/* BEFORE_CONTENT */}
        <ErrorBoundary><section className={style.manager}>
            <div className={style.manager_toolbar}>
                <input className={style.search} type="search" aria-label={vt('Rechercher dans ce dossier')} placeholder={vt('Rechercher dans ce dossier…')} value={query} onChange={e => { setQuery(e.target.value); setPage(0); }} />
                <div className={style.manager_actions}>
                    <FileManagerStatus />
                    <Button.Text disabled={refreshing} onClick={refresh}>{refreshing ? vt('Chargement…') : vt('Actualiser')}</Button.Text>
                    <Can action="file.create"><NewDirectoryButton /><UploadButton className={style.primary_action} /><NavLink to={`/server/${id}/files/new${hash}`}><Button className={style.primary_action}>{vt('Nouveau fichier')}</Button></NavLink></Can>
                    {/* FILE_BUTTONS */}
                </div>
            </div>
            <div className={style.manager_path}><FileManagerBreadcrumbs /></div>
            {!files ? <Spinner size="large" centered /> : <>
                <div className={style.file_table}>
                    <div className={style.file_table_header}>
                        <FileActionCheckbox type="checkbox" aria-label={vt('Sélectionner les fichiers affichés')} checked={visible.length > 0 && visible.every(file => selected.includes(file.name))} onChange={e => setSelectedFiles(selectPage(selected, visible.map(file => file.name), e.currentTarget.checked))} />
                        {([['name','Nom'],['size','Taille'],['modified','Modification']] as [SortKey,string][]).map(([key,label]) => <button type="button" key={key} onClick={() => order(key)} aria-label={`${vt(label)} — ${vt('Trier')}`}>{vt(label)}{sort === key ? descending ? ' ↓' : ' ↑' : ''}</button>)}<span />
                    </div>
                    {visible.map(file => <FileObjectRow key={file.key} file={file} />)}
                    {!visible.length && <div className={style.empty_state}><h3>{query ? vt('Aucun fichier ne correspond à la recherche.') : vt('Ce dossier est vide')}</h3><p>{query ? vt('Essayez un autre nom de fichier.') : vt('Importez un fichier ou créez votre premier document.')}</p></div>}
                    <MassActionsBar />
                </div>
                <div className={style.pagination}><span>{filtered.length} {vt(filtered.length === 1 ? 'élément' : 'éléments')}{selected.length ? ` · ${selected.length} ${vt('sélectionnés')}` : ''}</span>{lastPage > 0 && <><button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>{vt('Précédent')}</button><span>{currentPage + 1} / {lastPage + 1}</span><button disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>{vt('Suivant')}</button></>}</div>
            </>}
        </section></ErrorBoundary>
        {/* AFTER_CONTENT */}
    </ServerContentBlock>;
};
