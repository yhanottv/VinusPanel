import i18n from '@/i18n';
import english from './translations';

// Keep this Blueprint extension installable without the VinusPanel theme.
const french = Object.fromEntries(Object.keys(english).map((key) => [key, key]));
i18n.addResourceBundle('en', 'vinuscatalog', english, true, true);
i18n.addResourceBundle('fr', 'vinuscatalog', french, true, true);
export const formatLocale = i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-US';

export function vt(source: string, values: Record<string, string | number> = {}): string {
    const key = source.trim();
    if (!key) return source;
    return source.slice(0, source.indexOf(key)) + String(i18n.t(key, {
        ...values, ns: 'vinuscatalog', keySeparator: false, nsSeparator: false,
        defaultValue: key, interpolation: { escapeValue: false },
    })) + source.slice(source.indexOf(key) + key.length);
}
