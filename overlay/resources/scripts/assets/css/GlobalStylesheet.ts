import tw from 'twin.macro';
import { createGlobalStyle } from 'styled-components/macro';
import { VINUS } from '@/theme';
// @ts-expect-error untyped font file
import font from '@fontsource-variable/ibm-plex-sans/files/ibm-plex-sans-latin-wght-normal.woff2';

export default createGlobalStyle`
    :root {
        --vinus-accent: ${VINUS.colors.accent};
        --vinus-accent-dark: ${VINUS.colors.accentDark};
        --vinus-accent-soft: ${VINUS.colors.accentSoft};
        --vinus-accent-rgb: 255, 122, 26;
        --vinus-bg: #08080a;
        color-scheme: dark;
        --vinus-glass: #101012;
        --vinus-glass-navigation: linear-gradient(135deg, rgba(255,255,255,.025), transparent 42%, rgba(255,255,255,.008)), rgba(4,4,6,.88);
        --vinus-glass-shadow: none;
        --vinus-navigation-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 8px 24px rgba(0,0,0,.24);
        --vinus-sidebar: #0f0f13;
        --vinus-surface: #101012;
        --vinus-surface-raised: #19191d;
        --vinus-border: rgba(255, 255, 255, 0.09);
        --vinus-border-strong: rgba(255, 255, 255, 0.13);
        --vinus-muted: #8b8b98;
    }

    @font-face {
        font-family: 'IBM Plex Sans';
        font-style: normal;
        font-display: swap;
        font-weight: 100 700;
        src: url(${font}) format('woff2-variations');
        unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
    }

    * {
        box-sizing: border-box;
    }

    html {
        background: var(--vinus-bg);
    }

    body {
        ${tw`font-sans text-neutral-200`};
        min-height: 100vh;
        background: var(--vinus-bg);
        background-attachment: fixed;
        font-family: 'IBM Plex Sans', system-ui, sans-serif;
        -webkit-font-smoothing: antialiased;
        letter-spacing: 0;
        font-feature-settings: 'tnum' 1, 'cv02' 1, 'cv03' 1;
    }

    h1, h2, h3, h4, h5, h6 {
        ${tw`font-semibold font-header`};
        letter-spacing: -0.025em;
    }

    p {
        ${tw`text-neutral-300 leading-snug font-sans`};
    }

    form {
        ${tw`m-0`};
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        ${tw`outline-none`};
    }

    ::selection {
        color: #fff;
        background: rgba(var(--vinus-accent-rgb), 0.36);
    }

    a, button {
        -webkit-tap-highlight-color: transparent;
    }

    .server-layout,
    .server-route-content,
    .server-workspace {
        min-width: 0;
    }

    .server-layout {
        min-height: 100vh;
    }

    @media (max-width: 1023px) {
        .server-workspace > header {
            margin-left: 1rem;
            margin-right: 1rem;
            margin-top: 1rem;
        }
    }

    @media (min-width: 1024px) {
        .server-layout {
            display: grid;
            grid-template-columns: 15rem minmax(0, 1fr);
            gap: 0;
            width: 100%;
            max-width: 1920px;
            margin: 0 auto;
            padding: 0.75rem;
        }

        .server-workspace {
            min-height: calc(100vh - 1.5rem);
            padding: 1.5rem 2rem;
            background: transparent;
        }

        .server-route-content > * {
            min-width: 0;
        }
    }

    :where(a, button, input, textarea, select, [tabindex]):focus-visible {
        outline: 2px solid var(--vinus-accent-soft);
        outline-offset: 3px;
    }

    .vinus-surface {
        background: var(--vinus-glass);
        border: 1px solid var(--vinus-border);
        box-shadow: var(--vinus-glass-shadow);
    }

    .vinus-discord.vinus-discord {
        display: inline-flex; align-items: center; justify-content: center;
        width: 38px; height: 38px; padding: 8px; flex: 0 0 38px;
        color: #dedee5; background: transparent; border: 1px solid transparent;
        border-radius: 8px; text-decoration: none;
        transition: color 150ms ease, background-color 150ms ease;
    }
    .vinus-discord.vinus-discord:hover {
        color: #fff; background: rgba(88, 101, 242, .16); border-color: rgba(88, 101, 242, .24);
    }
    .vinus-discord:disabled { opacity: .45; cursor: not-allowed; }
    .vinus-discord svg { width: 22px; height: 22px; flex-shrink: 0; }
    .vinus-discord-announcement {
        display: flex; align-items: center; gap: 12px;
        margin-bottom: 24px; padding: 12px 16px;
        background: #0d0d10; border: 1px solid var(--vinus-border); border-radius: 8px;
    }
    .vinus-discord-announcement > svg { flex-shrink: 0; color: #929aff; width: 20px; height: 20px; }
    .vinus-discord-announcement p { margin: 0; color: #b7b7c2; font-size: 13px; line-height: 1.6; }
    .vinus-discord-announcement a { color: #d0d4ff; text-decoration: underline; text-underline-offset: 3px; white-space: nowrap; }
    .vinus-discord-announcement a:hover { color: #fff; }

    .skip-navigation {
        position: fixed;
        top: -5rem;
        left: 1rem;
        z-index: 9999;
        padding: .75rem 1rem;
        color: #111315;
        background: #ffb067;
        border-radius: .5rem;
    }
    .skip-navigation:focus { top: 1rem; }

    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation: none !important;
            transition: none !important;
            scroll-behavior: auto !important;
        }
    }

    @media (prefers-reduced-transparency: reduce) {
        :root { --vinus-glass-navigation: #09090b; --vinus-glass: #101012; }
        * { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
    }

    .fade-enter-active, .fade-appear-active {
        transition-duration: 120ms !important;
    }

    input[type=number]::-webkit-outer-spin-button,
    input[type=number]::-webkit-inner-spin-button {
        -webkit-appearance: none !important;
        margin: 0;
    }

    input[type=number] {
        -moz-appearance: textfield !important;
    }

    /* Normalize legacy panel surfaces so unmodified Pterodactyl screens still
       belong to the same visual system. */
    .bg-neutral-900,
    .bg-gray-900 {
        background-color: #0c0c0e !important;
    }

    .bg-neutral-800,
    .bg-gray-800 {
        background: var(--vinus-glass) !important;
    }

    .bg-neutral-700,
    .bg-gray-700 {
        background-color: var(--vinus-surface-raised) !important;
    }

    .border-neutral-600,
    .border-gray-600,
    .border-neutral-700,
    .border-gray-700 {
        border-color: rgba(255, 255, 255, 0.09) !important;
    }

    .shadow-lg,
    .shadow-md {
        box-shadow: var(--vinus-glass-shadow) !important;
    }

    ::-webkit-scrollbar {
        background: transparent;
        width: 10px;
        height: 10px;
    }

    ::-webkit-scrollbar-thumb {
        border: 3px solid transparent;
        border-radius: 999px;
        background: #44444e;
        background-clip: padding-box;
    }

    ::-webkit-scrollbar-track-piece {
        margin: 4px 0;
    }

    ::-webkit-scrollbar-corner {
        background: transparent;
    }
`;
