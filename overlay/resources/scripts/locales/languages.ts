export const languages = [
    { code: 'fr', name: 'Français', locale: 'fr-FR', greeting: 'Bonjour', workspace: 'Votre espace' },
    { code: 'en', name: 'English', locale: 'en-GB', greeting: 'Hello', workspace: 'Your workspace' },
    { code: 'de', name: 'Deutsch', locale: 'de-DE', greeting: 'Hallo', workspace: 'Dein Bereich' },
    { code: 'es', name: 'Español', locale: 'es-ES', greeting: 'Hola', workspace: 'Tu espacio' },
    { code: 'it', name: 'Italiano', locale: 'it-IT', greeting: 'Ciao', workspace: 'Il tuo spazio' },
    { code: 'pt', name: 'Português', locale: 'pt-PT', greeting: 'Olá', workspace: 'O teu espaço' },
    { code: 'nl', name: 'Nederlands', locale: 'nl-NL', greeting: 'Hallo', workspace: 'Jouw omgeving' },
    { code: 'tr', name: 'Türkçe', locale: 'tr-TR', greeting: 'Merhaba', workspace: 'Çalışma alanınız' },
] as const;
export type PanelLanguage = typeof languages[number]['code'];
