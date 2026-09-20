import React, { useEffect, useState } from 'react';
import { ActivityLogFilters, useActivityLogs } from '@/api/account/activity';
import { useFlashKey } from '@/plugins/useFlash';
import PageContentBlock from '@/components/elements/PageContentBlock';
import FlashMessageRender from '@/components/FlashMessageRender';
import { Link } from 'react-router-dom';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { ClockIcon, DesktopComputerIcon, XCircleIcon } from '@heroicons/react/solid';
import Spinner from '@/components/elements/Spinner';
import { styles as buttonStyles } from '@/components/elements/button/index';
import classNames from 'classnames';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import useLocationHash from '@/plugins/useLocationHash';
import style from '@/components/elements/activity/style.module.css';

export default () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('account');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });
    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => setFilters((value) => ({ ...value, filters: { ip: hash.ip, event: hash.event } })), [hash]);
    useEffect(() => clearAndAddHttpError(error), [error]);

    const filtered = !!(filters.filters?.event || filters.filters?.ip);

    return (
        <PageContentBlock title={'Activité | VinusPanel'}>
            <FlashMessageRender byKey={'account'} />
            <header className={style.activity_page_header}>
                <div>
                    <p className={style.eyebrow}>Journal de sécurité</p>
                    <h1>Activité du compte</h1>
                    <p>Retrouvez les connexions et opérations sensibles liées à votre compte.</p>
                </div>
                <div className={style.activity_summary}>
                    <ClockIcon className={'h-5 w-5'} />
                    <div>
                        <strong>
                            {data
                                ? `${data.pagination.total} événement${data.pagination.total > 1 ? 's' : ''}`
                                : 'Chargement…'}
                        </strong>
                        <span>Du plus récent au plus ancien</span>
                    </div>
                </div>
            </header>
            {filtered && (
                <div className={'mb-3 flex justify-end'}>
                    <Link
                        to={'#'}
                        className={classNames(buttonStyles.button, buttonStyles.text, 'w-full sm:w-auto')}
                        onClick={() => setFilters((value) => ({ ...value, filters: {} }))}
                    >
                        Effacer les filtres <XCircleIcon className={'ml-2 h-4 w-4'} />
                    </Link>
                </div>
            )}
            {!data && isValidating ? (
                <Spinner centered />
            ) : !data?.items.length ? (
                <div className={style.empty_state}>
                    <ClockIcon />
                    <h3>Aucune activité disponible</h3>
                    <p>Les prochains événements de votre compte apparaîtront ici.</p>
                </div>
            ) : (
                <div className={style.list}>
                    {data.items.map((activity) => (
                        <ActivityLogEntry key={activity.id} activity={activity}>
                            {typeof activity.properties.useragent === 'string' && (
                                <Tooltip content={activity.properties.useragent} placement={'top'}>
                                    <span>
                                        <DesktopComputerIcon />
                                    </span>
                                </Tooltip>
                            )}
                        </ActivityLogEntry>
                    ))}
                </div>
            )}
            {data && (
                <PaginationFooter
                    pagination={data.pagination}
                    onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                />
            )}
        </PageContentBlock>
    );
};
