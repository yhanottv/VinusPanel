# Live Design Studio

Administrators open **Design** using the paintbrush in the top bar. The editor keeps a draft on the left and renders the real panel in a separate preview on the right. Desktop (1600 px), tablet (768 px), and mobile (390 px) frames use their own responsive viewport. Preview the dashboard, server overview, console, or sign-in layout.

Changes are applied to the preview immediately. **Save** publishes them to all panel users; **Cancel** restores the last saved design. Leaving with an unsaved draft triggers a warning. User palette preferences remain local unless the administrator disables the palette picker.

## Available categories

- Identity: name, logo mode, dark/light artwork, square mark and alternative text.
- Colours, typography and icons: dark/light surfaces, text, status colours, installed/system font families, icon corners and stroke weight.
- Surfaces and layout: radii, borders, shadows, opacity, wallpaper, content width, sidebar variants, active links, search and footer.
- Navigation: rename, hide and order existing items within their groups; add custom links. Existing route permissions still apply.
- Sign-in: left/right/centred layouts, form surfaces, background effects, width and editorial text.
- Dashboard: server list/grid default, artwork, quick links, activity and welcome notice.
- Servers: navigation position, header, address privacy, overview information, power-button appearance and individual server banners.
- Console: resource/chart positions, line/bar charts, empty state, fonts, prompt and literal display-only log replacements.
- Custom CSS: select an element in the preview or write a selector and declarations. Imports, resource URLs, escapes and executable CSS syntax are rejected.
- Motion and page metadata. Reduced-motion preferences are respected.
- Available project modules. Integrations not included in VinusPanel are not advertised as installed.

Only existing languages, icon artwork and font families are offered. This is an original implementation for VinusPanel; it does not install the commercial reference theme or its additional modules.

## Storage and access

Instance settings remain in `storage/app/vinuspanel/design.json`; uploaded images remain in `public/assets/vinus/custom`. Neither belongs in a public repository or release archive. Old files are read with defaults for newly introduced settings. User-specific server artwork is filtered by the existing wrapper access checks.

Only authenticated root administrators can load or save the editor. Preview messages must originate from the same-origin parent window. Interactive server actions are intercepted in preview; console command submission also has an explicit preview guard. An authenticated administrator's preview GET can be embedded by the same origin, with `frame-ancestors 'self'`; other responses retain `X-Frame-Options: DENY`. A stricter pre-existing frame policy is preserved.

## Verification

Run `php scripts/test-design.php /path/to/pterodactyl` for settings validation and frame-policy tests. Run the frontend `designRuntime.test.ts` suite inside a Pterodactyl source tree with the overlay applied. Both standard and Blueprint overlays preserve their existing extension hooks.
