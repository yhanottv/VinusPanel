/** @jest-environment jsdom */
import i18n from '@/i18n';
import { vt } from './translate';
import { readLanguage, validLanguage, LANGUAGE_STORAGE_KEY } from './preferences';
import { languages } from './languages';

afterEach(async () => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
    await i18n.changeLanguage('fr');
});

it('switches interface strings and interpolates values without translating the values', async () => {
    await i18n.changeLanguage('en');
    expect(vt('Vos serveurs')).toBe('Your servers');
    expect(vt('Copier l’adresse {{address}}', { address: 'localhost:25565' })).toBe('Copy address localhost:25565');
    expect(vt('  En ligne ')).toBe('  Online ');
    expect(vt('Unknown user content')).toBe('Unknown user content');
    await i18n.changeLanguage('fr');
    expect(vt('Vos serveurs')).toBe('Vos serveurs');
    expect(vt('{{count}} affiché(s)', { count: 2 })).toBe('2 affiché(s)');
});

it('preserves French punctuation, literal colons and entity spacing', async () => {
    await i18n.changeLanguage('en');
    expect(vt('Limite : {{value}}', { value: '100%' })).toBe('Limit: 100%');
    expect(vt('Propulsé par\u00a0')).toBe('Powered by\u00a0');
    expect(vt('Besoin d’aide ou un bug à signaler ? Rejoignez notre Discord :')).toContain('Join our Discord:');
});

it('retains the selected language and validates URL overrides', () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    expect(readLanguage()).toBe('en');
    window.history.replaceState({}, '', '/?lang=fr');
    expect(readLanguage()).toBe('fr');
    window.history.replaceState({}, '', '/?lang=invalid');
    expect(readLanguage()).toBe('en');
    expect(validLanguage('<script>')).toBeNull();
});

it('supports the URL fallback when storage is unavailable', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    try {
        expect(readLanguage()).toBe('fr');
        window.history.replaceState({}, '', '/?lang=en');
        expect(readLanguage()).toBe('en');
    } finally { spy.mockRestore(); }
});

it.each([
    ['de', 'Deine Server'], ['es', 'Tus servidores'], ['it', 'I tuoi server'],
    ['pt', 'Os teus servidores'], ['nl', 'Je servers'], ['tr', 'Sunucularınız'],
])('loads %s and preserves interpolated server addresses', async (language, title) => {
    await i18n.changeLanguage(language);
    expect(vt('Vos serveurs')).toBe(title);
    expect(vt('Copier l’adresse {{address}}', {address:'example.test:25565'})).toContain('example.test:25565');
    expect(validLanguage(language)).toBe(language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    expect(readLanguage()).toBe(language);
});

it('translates design settings in English and uses English for missing additional-language messages', async () => {
    await i18n.changeLanguage('en');
    expect(vt('Forme des graphiques')).toBe('Chart style');
    expect(vt('Toutes les modifications sont enregistrées')).toBe('All changes are saved');
    await i18n.changeLanguage('de');
    expect(vt('Une règle CSS contient une syntaxe non autorisée.')).toBe('A CSS rule contains unsupported syntax.');
    expect(languages).toHaveLength(8);
});
