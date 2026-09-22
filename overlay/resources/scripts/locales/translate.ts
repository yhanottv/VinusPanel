import i18n from '@/i18n';

// Explicit calls only: never translate server names, filenames, commands or logs.
export function vt(source: string, values: Record<string, string | number> = {}): string {
    const key = source.trim();
    if (!key) return source;
    const translated = String(i18n.t(key, {
        ...values, ns: 'vinus', keySeparator: false, nsSeparator: false,
        defaultValue: key, interpolation: { escapeValue: false },
    }));
    return source.slice(0, source.indexOf(key)) + translated + source.slice(source.indexOf(key) + key.length);
}
