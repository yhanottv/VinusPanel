import { vinusDesign } from '@/vinusDesign';
export type PanelLanguage = 'fr' | 'en';
export const LANGUAGE_STORAGE_KEY = 'vinus:language';

export function validLanguage(value: string | null | undefined): PanelLanguage | null {
    return value === 'fr' || value === 'en' ? value : null;
}

export function readLanguage(): PanelLanguage {
    if (typeof window === 'undefined') return 'fr';
    const requested = validLanguage(new URL(window.location.href).searchParams.get('lang'));
    if (requested) return requested;
    try {
        return validLanguage(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)) || validLanguage(vinusDesign.options.default_language) || 'fr';
    } catch {
        return 'fr';
    }
}

export const panelLanguage = readLanguage();
export const formatLocale = panelLanguage === 'fr' ? 'fr-FR' : 'en-US';

// A navigation also refreshes module-level labels, form schemas and the terminal.
// The URL fallback keeps switching usable when browser storage is disabled.
export function changeLanguage(value: string): void {
    const next = validLanguage(value);
    if (!next || next === panelLanguage) return;
    try { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* URL fallback below. */ }
    const destination = new URL(window.location.href);
    destination.searchParams.set('lang', next);
    window.location.assign(destination.toString());
}
