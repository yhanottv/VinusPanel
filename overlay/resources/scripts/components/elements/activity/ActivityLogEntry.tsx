import { panelLanguage } from '@/locales/preferences';
import { vt } from '@/locales/translate';
import React from 'react';
import { Link } from 'react-router-dom';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import Translate from '@/components/elements/Translate';
import { format, formatDistanceToNowStrict } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ActivityLog } from '@definitions/user';
import ActivityLogMetaButton from '@/components/elements/activity/ActivityLogMetaButton';
import classNames from 'classnames';
import style from './style.module.css';
import Avatar from '@/components/Avatar';
import useLocationHash from '@/plugins/useLocationHash';
import { getObjectKeys, isObject } from '@/lib/objects';

interface Props {
    activity: ActivityLog;
    children?: React.ReactNode;
}

const friendlyEvents: Record<string, { label: string; description: string }> = {
    'auth:success': { label: vt("Connexion réussie"), description: vt("Connexion au compte autorisée.") },
    'auth:failed': { label: vt("Connexion refusée"), description: vt("Une tentative de connexion a été refusée.") },
    'auth:password-reset': {
        label: vt("Mot de passe"),
        description: vt("Une réinitialisation du mot de passe a été demandée."),
    },
    'account:email.update': { label: vt("Adresse e-mail"), description: vt("L’adresse e-mail du compte a été mise à jour.") },
    'account:password.update': { label: vt("Mot de passe"), description: vt("Le mot de passe du compte a été modifié.") },
};

function wrapProperties(value: unknown): any {
    if (value === null || typeof value === 'string' || typeof value === 'number')
        return `<strong>${String(value)}</strong>`;
    if (isObject(value)) {
        return getObjectKeys(value).reduce((object, key) => {
            if (key === 'count' || (typeof key === 'string' && key.endsWith('_count')))
                return { ...object, [key]: value[key] };
            return { ...object, [key]: wrapProperties(value[key]) };
        }, {} as Record<string, unknown>);
    }
    if (Array.isArray(value)) return value.map(wrapProperties);
    return value;
}

export default ({ activity, children }: Props) => {
    const { pathTo } = useLocationHash();
    const actor = activity.relationships.actor;
    const friendly = friendlyEvents[activity.event];
    const properties = wrapProperties(activity.properties);

    return (
        <article className={style.entry}>
            <div className={style.timeline}>
                <div className={style.avatar}>
                    <Avatar name={actor?.uuid || 'system'} />
                </div>
            </div>
            <div className={style.content}>
                <div className={style.event_row}>
                    <div className={style.event_identity}>
                        <Tooltip placement={'top'} content={actor?.email || vt("Événement système")}>
                            <strong>{actor?.username || vt("Système")}</strong>
                        </Tooltip>
                        <Link to={`#${pathTo({ event: activity.event })}`} className={style.event_badge}>
                            {friendly?.label || activity.event.replace(/[:.]/g, ' · ')}
                        </Link>
                        <div className={classNames(style.icons, 'activity-entry-tools')}>{children}</div>
                    </div>
                    <Tooltip
                        placement={'left'}
                        content={format(activity.timestamp, (panelLanguage === 'fr' ? "dd MMMM yyyy 'à' HH:mm:ss" : "MMM dd yyyy 'at' HH:mm:ss"), { locale: panelLanguage === 'fr' ? fr : enUS })}
                    >
                        <time className={style.event_time}>
                            {formatDistanceToNowStrict(activity.timestamp, { addSuffix: true, locale: panelLanguage === 'fr' ? fr : enUS })}
                        </time>
                    </Tooltip>
                </div>
                <p className={style.description}>
                    {friendly ? (
                        friendly.description
                    ) : (
                        <Translate ns={'activity'} values={properties} i18nKey={activity.event.replace(':', '.')} />
                    )}
                </p>
                <div className={style.meta_row}>
                    {activity.ip && (
                        <Link to={`#${pathTo({ ip: activity.ip })}`} className={style.meta_chip}>
                            {activity.ip}
                        </Link>
                    )}
                    <span className={style.meta_chip}>{activity.isApi ? 'API' : vt("Interface web")}</span>
                    {activity.hasAdditionalMetadata && <ActivityLogMetaButton meta={activity.properties} />}
                </div>
            </div>
        </article>
    );
};
