import React, { useEffect } from 'react';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import { NavLink, useLocation } from 'react-router-dom';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import useFileManagerSWR from '@/plugins/useFileManagerSwr';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath } from '@/helpers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFolderOpen } from '@fortawesome/free-solid-svg-icons';
import style from './style.module.css';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSWR();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
    }, [hash]);

    useEffect(() => {
        mutate();
    }, [directory]);

    const onSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(event.currentTarget.checked ? files?.map((file) => file.name) || [] : []);
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <ErrorBoundary>
                <div className={style.manager_toolbar}>
                    <div className={style.manager_path}>
                        <FileManagerBreadcrumbs
                            renderLeft={
                                <FileActionCheckbox
                                    type={'checkbox'}
                                    css={tw`mr-3`}
                                    checked={selectedFilesLength === (files?.length === 0 ? -1 : files?.length)}
                                    onChange={onSelectAllClick}
                                />
                            }
                        />
                    </div>
                    <Can action={'file.create'}>
                        <div className={style.manager_actions}>
                            <FileManagerStatus />
                            <NewDirectoryButton />
                            <UploadButton />
                            <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                <Button>Nouveau fichier</Button>
                            </NavLink>
                        </div>
                    </Can>
                </div>
            </ErrorBoundary>

            <div className={style.manager_summary}>
                <div>
                    <FontAwesomeIcon icon={faFolderOpen} />
                    <span>{directory === '/' ? 'Racine du serveur' : directory}</span>
                </div>
                <span>{files ? `${files.length} élément${files.length > 1 ? 's' : ''}` : 'Chargement…'}</span>
            </div>

            {!files ? (
                <Spinner size={'large'} centered />
            ) : !files.length ? (
                <div className={style.empty_state}>
                    <FontAwesomeIcon icon={faFileAlt} />
                    <h3>Ce dossier est vide</h3>
                    <p>Importez un fichier ou créez votre premier document.</p>
                </div>
            ) : (
                <CSSTransition classNames={'fade'} timeout={150} appear in>
                    <div className={style.file_table}>
                        <div className={style.file_table_header}>
                            <span>Nom</span>
                            <span>Taille</span>
                            <span>Modification</span>
                            <span />
                        </div>
                        {files.length > 250 && (
                            <div css={tw`rounded-lg bg-yellow-400 mb-2 p-3`}>
                                <p css={tw`text-center text-sm text-yellow-900`}>
                                    Ce dossier contient plus de 250 éléments. Seuls les premiers sont affichés.
                                </p>
                            </div>
                        )}
                        {sortFiles(files.slice(0, 250)).map((file) => (
                            <FileObjectRow key={file.key} file={file} />
                        ))}
                        <MassActionsBar />
                    </div>
                </CSSTransition>
            )}
        </ServerContentBlock>
    );
};
