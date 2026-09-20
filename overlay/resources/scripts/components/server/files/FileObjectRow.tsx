import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faFileArchive, faFileImport, faFolder } from '@fortawesome/free-solid-svg-icons';
import { encodePathSegments } from '@/helpers';
import { format } from 'date-fns';
import React, { memo } from 'react';
import { FileObject } from '@/api/server/files/loadDirectory';
import FileDropdownMenu from '@/components/server/files/FileDropdownMenu';
import { ServerContext } from '@/state/server';
import { NavLink, useRouteMatch } from 'react-router-dom';
import isEqual from 'react-fast-compare';
import SelectFileCheckbox from '@/components/server/files/SelectFileCheckbox';
import { usePermissions } from '@/plugins/usePermissions';
import { join } from 'pathe';
import { bytesToString } from '@/lib/formatters';
import styles from './style.module.css';

const Clickable: React.FC<{ file: FileObject }> = memo(({ file, children }) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const match = useRouteMatch();

    return (file.isFile && (!file.isEditable() || !canReadContents)) || (!file.isFile && !canRead) ? (
        <div className={styles.details}>{children}</div>
    ) : (
        <NavLink
            className={styles.details}
            to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}
        >
            {children}
        </NavLink>
    );
}, isEqual);

const FileObjectRow = ({ file }: { file: FileObject }) => (
    <div
        className={styles.file_row}
        key={file.name}
        onContextMenu={(event) => {
            event.preventDefault();
            window.dispatchEvent(new CustomEvent(`pterodactyl:files:ctx:${file.key}`, { detail: event.clientX }));
        }}
    >
        <SelectFileCheckbox name={file.name} />
        <Clickable file={file}>
            <div className={file.isFile ? styles.file_icon : styles.folder_icon}>
                <FontAwesomeIcon
                    icon={
                        file.isFile
                            ? file.isSymlink
                                ? faFileImport
                                : file.isArchiveType()
                                ? faFileArchive
                                : faFileAlt
                            : faFolder
                    }
                />
            </div>
            <div className={styles.file_name}>
                <strong>{file.name}</strong>
                <span>{file.isFile ? file.mimetype || 'Fichier' : 'Dossier'}</span>
            </div>
            <div className={styles.file_size}>{file.isFile ? bytesToString(file.size) : '—'}</div>
            <div className={styles.file_date} title={file.modifiedAt.toString()}>
                {format(file.modifiedAt, 'dd/MM/yyyy HH:mm')}
            </div>
        </Clickable>
        <FileDropdownMenu file={file} />
    </div>
);

export default memo(FileObjectRow, (previous, next) => {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { isArchiveType, isEditable, ...previousFile } = previous.file;
    const { isArchiveType: nextArchiveType, isEditable: nextEditable, ...nextFile } = next.file;
    /* eslint-enable @typescript-eslint/no-unused-vars */
    return isEqual(previousFile, nextFile);
});
