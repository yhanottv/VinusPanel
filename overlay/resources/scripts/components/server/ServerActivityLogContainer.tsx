import { vt } from '@/locales/translate';
import React, { useEffect, useState } from 'react';
import { useActivityLogs } from '@/api/server/activity';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useFlashKey } from '@/plugins/useFlash';
import FlashMessageRender from '@/components/FlashMessageRender';
import Spinner from '@/components/elements/Spinner';
import ActivityLogEntry from '@/components/elements/activity/ActivityLogEntry';
import PaginationFooter from '@/components/elements/table/PaginationFooter';
import { ActivityLogFilters } from '@/api/account/activity';
import { Link } from 'react-router-dom';
import classNames from 'classnames';
import { styles as buttonStyles } from '@/components/elements/button/index';
import { ClockIcon, XCircleIcon } from '@heroicons/react/solid';
import useLocationHash from '@/plugins/useLocationHash';
import style from '@/components/elements/activity/style.module.css';

export default () => {
    const { hash } = useLocationHash();
    const { clearAndAddHttpError } = useFlashKey('server:activity');
    const [filters, setFilters] = useState<ActivityLogFilters>({ page: 1, sorts: { timestamp: -1 } });
    const { data, isValidating, error } = useActivityLogs(filters, {
        revalidateOnMount: true,
        revalidateOnFocus: false,
    });

    useEffect(() => setFilters((value) => ({ ...value, filters: { ip: hash.ip, event: hash.event } })), [hash]);
    useEffect(() => clearAndAddHttpError(error), [error]);

    return (
        <ServerContentBlock title={'Activity Log'}>
            <FlashMessageRender byKey={'server:activity'} />
            {(filters.filters?.event || filters.filters?.ip) && (
                <div className={'mb-3 flex justify-end'}>
                    <Link
                        to={'#'}
                        className={classNames(buttonStyles.button, buttonStyles.text, 'w-full sm:w-auto')}
                        onClick={() => setFilters((value) => ({ ...value, filters: {} }))}
                    >{vt("Effacer les filtres ")}<XCircleIcon className={'ml-2 h-4 w-4'} />
                    </Link>
                </div>
            )}
            {!data && isValidating ? (
                <Spinner centered />
            ) : !data?.items.length ? (
                <div className={style.empty_state}>
                    <ClockIcon />
                    <h3>{vt("Aucune activité serveur")}</h3>
                    <p>{vt("Les prochaines opérations apparaîtront ici.")}</p>
                </div>
            ) : (
                <div className={style.list}>
                    {data.items.map((activity) => (
                        <ActivityLogEntry key={activity.id} activity={activity} />
                    ))}
                </div>
            )}
            {data && (
                <PaginationFooter
                    pagination={data.pagination}
                    onPageSelect={(page) => setFilters((value) => ({ ...value, page }))}
                />
            )}
        </ServerContentBlock>
    );
};
