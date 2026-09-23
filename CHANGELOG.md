# VinusPanel changelog

## 3.0.0 — Design Studio

- added an administrator-only Design page for the panel name, accent, background, surface, text, logo and background image;
- added per-server colors and uploaded banners on dashboard cards, server navigation and headers;
- stored design settings and uploaded images on the VPS so theme upgrades retain them;
- added a detailed French VPS installation and customization guide;
- kept uploads limited to validated PNG, JPEG and WebP images and scoped server design data to accessible servers.

## 2.4.0 — French and English

- added a French/English selector to authentication and client pages, with a browser preference and a URL fallback when storage is unavailable;
- localized VinusPanel interface labels, validation messages, console status, charts, dates and navigation; switching language reloads the current page;
- added self-contained catalog UI translations in Vinus Catalog 1.2.0, preserving standalone Blueprint installation;
- refreshed the screenshot gallery with the login screen, server list, live resource charts and the terminal eagle.

Server names, user content, game logs and third-party extension text are not translated. Legacy administration and original upstream screens retain their own translations.

## 2.3.6 — Discord community link

- replaced the chat button with an accessible Discord logo link;
- added a compact help and bug-report announcement at the top of client pages;
- configured the community invitation, shared by both links and customizable per installation.

## 2.3.5 — Black glass navigation

- replaced the gray navigation tint with translucent black, subtle reflections and finer borders;
- retained blur and accessible focus indicators, with a restrained orange active-tab marker;
- matched desktop sidebars, mobile navigation and the reduced-transparency fallback.

## 2.3.4 — Black surfaces and direct resource graphs

- restored black backgrounds and removed metallic gradients and raised card/button edges, retaining navigation glass;
- replaced the resource accordion with three always-visible charts;
- clarified metric hierarchy and network directions, with compact localized axis labels and stable chart heights.

## 2.3.3 — Centered eagle signature

- replaced the wordmark with a detailed Unicode rendering sampled from the supplied eagle logo, proportionally fitted and horizontally centered within the terminal;
- retained orange coloring and persistent normal scrollback.

## 2.3.2 — Persistent console artwork

- replaced the temporary introduction with the supplied orange block artwork in normal terminal scrollback, immediately after the initial server status and startup transitions;
- removed the 1.8-second timeout, alternate screen and log buffering;
- preserved the drawing on idle consoles and adapted it to narrow viewports;
- prevented duplicate signatures from repeated status events and preserved history on reconnection.

## 2.3.1 — Temporary terminal introduction

- replaced the fixed ASCII banner with a brief introduction rendered inside xterm on page entry and server startup;
- restored the log screen after 1.8 seconds, preserving buffered output in order;
- simplified the console to a single flat toolbar and command line;
- added regression checks for intro expiry, output preservation, cleanup and narrow terminals.

## 2.3.0 — Clear diagnostics and catalogue artwork

- removed duplicate CPU, memory and network metrics from the control column;
- added validated Modrinth icons with fallbacks and a configurable Discord button;
- added an ASCII console signature and localized connection guidance;
- removed persistent command history and added safe HTTP error messages;
- consumed catalogue installation tokens before downloads and capped batches at 100 MiB;
- added catalogue error references and regression coverage.

## 2.2.1 — Satin surfaces and resource overview

- added directional highlights and shadows to content surfaces, keeping navigation glass separate;
- moved resource graphs above the console workspace and expanded them by default;
- preserved mounted charts when collapsed, retaining their live history.

## 2.2.0 — Matte workspace and Blueprint catalogue

- limited Liquid Glass to navigation and simplified the server status;
- retained chart datasets across telemetry updates, animated new points and preserved history when charts are collapsed;
- calculated network rates from actual elapsed time;
- added a portable Modrinth catalogue as a native Blueprint extension, with separate hybrid-server categories;
- validated downloads and required dependencies, tracked compatible updates and preserved previous JARs;
- added automatic recovery for failed installation batches and isolated installation tests;
- preserved Blueprint hooks and Pterodactyl 1.15.1 security middleware in the optional integration.


## 2.1.0 — Console workspace

- rebuilt the console with its own page header, a large terminal and a separate control column;
- added server-state-aware controls, retaining permission checks and forced-stop confirmation;
- grouped CPU, memory, storage, uptime and traffic in a responsive telemetry panel;
- made detailed resource charts expandable;
- disabled power actions while disconnected, before status is known, and during conflict states;
- retained terminal command history, search, live logs and responsive resizing;
- added 15 state-transition and availability tests for power controls.

## 2.0.0 — Liquid Glass

- introduced a smoked-glass design system with warm orange accents and restrained surface reflections;
- rebuilt the sign-in page with a static glass illustration and removed the unverified system-status claim;
- simplified both workspaces with narrower translucent navigation and more room for content;
- redesigned server summaries and adaptive list cards without fixed-width overflow;
- moved the live terminal above resource charts and compacted file-manager rows;
- aligned account, profile, shared forms, and legacy administration with the new surfaces;
- made server search a labelled keyboard-operable button and added skip-to-content links;
- added global visible focus, reduced-motion and reduced-transparency support;
- corrected terminal resizing, sticky navigation height, and the legacy authentication top gap;
- kept existing server actions, permission checks, authentication, and data storage intact.


## 1.4.0 — Identity and activity

- rebuilt the sign-in experience around a responsive animated control-room scene;
- added reduced-motion support for decorative login animations;
- introduced a dedicated profile page with browser-local display names and avatars;
- propagated profile appearance to the dashboard, sidebar, and account header;
- redesigned account and server activity logs as compact security timelines;
- added event summaries, filter states, localized labels, and clearer metadata;
- refreshed the legacy administration interface through isolated, reversible CSS only;
- kept all authentication, authorization, administrative workflows, and server APIs unchanged.

## 1.3.0 — Full control workspace

- replaced the legacy top navigation with a fixed application sidebar;
- rebuilt the authenticated dashboard and account workspace around a consistent graphite design system;
- reorganized every server route into grouped, permission-aware navigation;
- redesigned the live console as a complete monitoring workspace with KPIs, trends, and a full-width terminal;
- rebuilt the file manager with a dedicated toolbar, table header, richer file rows, and an empty state;
- unified modern and legacy buttons, inputs, cards, rows, borders, spacing, and focus states;
- improved French labels on account and security forms;
- preserved responsive navigation and safe installer rollback behavior.

## 1.2.0 — Workspace refresh

- introduced a Pyrodactyl-inspired workspace while preserving VinusPanel's own identity and assets;
- added persistent grid and list layouts to the server dashboard;
- redesigned server cards for both compact and detailed browsing;
- rebuilt the server sidebar with stronger navigation, branding, and active-server context;
- simplified page headers and surfaces for a cleaner, more focused interface;
- improved responsive behavior and keyboard-visible controls.

## 1.1.0 — Complete interface redesign

- introduced an immersive and responsive sign-in page;
- added a server dashboard with instance summaries and live status cards;
- improved server cards for faster scanning and better resource visibility;
- added a contextual header shared by every server page;
- made power controls consistently accessible throughout the server workspace;
- redesigned the sidebar, active states, console, metrics, and charts;
- completed additional French interface translations;
- removed unnecessary hard-coded decorative elements.

## 1.0.0 — Initial release

- introduced the VinusPanel identity and eagle artwork;
- added the dark-orange visual system;
- added automatic installation, backup, rollback, and uninstall tooling.
