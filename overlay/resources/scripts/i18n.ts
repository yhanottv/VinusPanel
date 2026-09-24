import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import I18NextHttpBackend, { HttpBackendOptions } from 'i18next-http-backend';
import I18NextMultiloadBackendAdapter from 'i18next-multiload-backend-adapter';
import vinusEnglish from '@/locales/en';
import vinusGerman from '@/locales/de';
import vinusSpanish from '@/locales/es';
import vinusItalian from '@/locales/it';
import vinusPortuguese from '@/locales/pt';
import vinusDutch from '@/locales/nl';
import vinusTurkish from '@/locales/tr';
import { languages } from '@/locales/languages';
import { panelLanguage } from '@/locales/preferences';

const vinusFrench = { ...Object.fromEntries(Object.keys(vinusEnglish).map((key) => [key, key])),
    Tuer: 'Forcer l’arrêt', Dashboard: 'Tableau de bord',
};
if (typeof document !== 'undefined') document.documentElement.lang = panelLanguage;

// If we're using HMR use a unique hash per page reload so that we're always
// doing cache busting. Otherwise just use the builder provided hash value in
// the URL to allow cache busting to occur whenever the front-end is rebuilt.
const hash = module.hot ? Date.now().toString(16) : process.env.WEBPACK_BUILD_HASH;

i18n.use(I18NextMultiloadBackendAdapter)
    .use(initReactI18next)
    .init({
        debug: process.env.DEBUG === 'true',
        lng: panelLanguage,
        fallbackLng: 'en',
        supportedLngs: languages.map(language => language.code),
        ns: ['vinus'],
        defaultNS: 'translation',
        partialBundledLanguages: true,
        resources: { en: { vinus: vinusEnglish }, fr: { vinus: vinusFrench },
            de: { vinus: vinusGerman }, es: { vinus: vinusSpanish }, it: { vinus: vinusItalian },
            pt: { vinus: vinusPortuguese }, nl: { vinus: vinusDutch }, tr: { vinus: vinusTurkish },
        },
        keySeparator: '.',
        backend: {
            backend: I18NextHttpBackend,
            backendOption: {
                loadPath: '/locales/locale.json?locale={{lng}}&namespace={{ns}}',
                queryStringParams: { hash },
                allowMultiLoading: true,
            } as HttpBackendOptions,
        } as Record<string, any>,
        interpolation: {
            // Per i18n-react documentation: this is not needed since React is already
            // handling escapes for us.
            escapeValue: false,
        },
    });

export default i18n;
