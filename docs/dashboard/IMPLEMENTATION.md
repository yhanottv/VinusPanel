# Dashboard refresh

The dashboard follows the observed layout of the DezerX demonstration: a 256 px sidebar, inset workspace, search and account controls, greeting, dismissible announcement, four shortcuts, compact server rows and recent account activity. The implementation is written for VinusPanel; its branding, account data, permissions and working destinations remain specific to this project.

## Visual system

- Background `#0b0d12`, surfaces `#101319`, raised controls `#171b23`, text `#e2e8f0`, muted text `#9ba3b1`, accent `#49a6e9`.
- Self-hosted Montserrat variable font, distributed under the included SIL Open Font License.
- 32 px desktop content gutters, 14 px cards, 24 px heading, consistent outline SVG icons.
- At phone widths, the header provides a menu and options button, search spans the available width, shortcuts scroll horizontally and each server has a full-width management link below its resources.
- Hover and control transitions take 120 ms, change no layout dimensions and respect reduced-motion preferences.

Design Studio still controls the panel-wide palette, logo and server banners. The dashboard color selector and light-mode switch are per-account preferences stored in the current browser. Shortcuts lead to the account, community, project and issue tracker; there is no fictitious billing service or server provisioning endpoint. The creation shortcut is restricted to administrators and opens the existing server creation form.

## Data and integration

Server pagination and administrator visibility use the existing client API. Resource requests are sequential, refresh every 30 seconds and stop on unmount, including when an initial request resolves after leaving the page. Failed requests display an unavailable state and retry on the next poll. Suspended, installing, transferring, restoring and maintenance states do not trigger unnecessary requests.

The activity card displays the latest API batch in groups of three. Its page count describes that batch; the complete log is available through “View all”. Errors are distinct from an empty history. The base overlay and Blueprint variant preserve their respective routing and extension insertion points.

## Validation

Validated on the existing Pterodactyl 1.15.1 installation with Blueprint:

- TypeScript checks for both routing variants.
- Production webpack build and package manifest check.
- 93 frontend tests across 10 suites, including four resource polling regressions.
- Browser checks for search results, activity pagination, color selection, light/dark appearance, list/grid layout, sidebar sections, phone navigation and French/English switching.
- Desktop, tablet and phone layout checks and screenshots; screenshots containing installation-specific account details are kept outside the public repository.

The installed dependency tree contains incompatible versions in the legacy `babel-jest` JSX transform. Tests were run with the existing TypeScript transformer instead, from the prepared panel directory:

```sh
./node_modules/.bin/jest --runInBand --transform '{"^.+\\.tsx?$": ["ts-jest", {"tsconfig": {"jsx": "react"}, "isolatedModules": true}]}'
```

Compilation is performed in a separate directory. During deployment, existing sources, the asset manifest and design settings are backed up. New assets are copied before the manifest is replaced, and old hashed assets remain available to existing sessions. No game server restart is required.

This validates the changed frontend on the existing installation; it is not a new clean-install or exhaustive cross-browser certification.
