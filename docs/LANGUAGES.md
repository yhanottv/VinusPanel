# Interface languages

The theme offers French, English, German, Spanish, Italian, Portuguese (Portugal), Dutch and Turkish. The shared selector displays locally rendered SVG flags, native language names and the selected language in the dashboard and sign-in screens. It supports touch, arrow keys, Home/End, Escape and normal Tab navigation.

French and English cover the theme interface, including Design Studio categories, controls, descriptions and preview choices. The six additional catalogs each translate more than 200 messages covering navigation, the dashboard, sign-in, console controls, resource charts and common design settings. Specialized administration and Minecraft installation descriptions that are not yet translated fall back to English. Third-party Blueprint extensions manage their own translations.

Catalogs live in `overlay/resources/scripts/locales/`. Add entries using the existing French source keys and preserve interpolation placeholders such as `{{address}}`. Never translate server names, file paths, commands, console output or user-entered theme copy. Date formatting uses the selected locale.

The personal language choice is stored in the browser and the `lang` URL parameter. The panel's default language is configured in Design Studio and validated by the server. Changing the preview language does not overwrite a user's personal language preference.

Run `locales/translate.spec.ts` and `components/elements/LanguageSelector.spec.tsx` in the Pterodactyl source tree for catalog, fallback and keyboard interaction checks. `scripts/test-design.php` validates every supported default language.
