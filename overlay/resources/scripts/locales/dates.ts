import { fr, enGB, de, es, it, pt, nl, tr } from 'date-fns/locale';
import { panelLanguage } from './preferences';
export const dateLocale = { fr, en: enGB, de, es, it, pt, nl, tr }[panelLanguage];
