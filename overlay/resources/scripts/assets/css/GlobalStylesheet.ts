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
        --vinus-sidebar: #0f0f13;
        --vinus-surface: #151519;
        --vinus-surface-raised: #1b1b21;
        --vinus-border: rgba(255, 255, 255, 0.08);
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
        background:
            radial-gradient(circle at 12% -14rem, rgba(var(--vinus-accent-rgb), 0.1), transparent 34rem),
            linear-gradient(180deg, #09090b 0%, #070709 100%);
        background-attachment: fixed;
        letter-spacing: 0.003em;
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
            grid-template-columns: 18.5rem minmax(0, 1fr);
            gap: 0.75rem;
            width: 100%;
            max-width: 1920px;
            margin: 0 auto;
            padding: 0.75rem;
        }

        .server-workspace {
            min-height: calc(100vh - 1.5rem);
            padding: 1.75rem;
            overflow: hidden;
            border: 1px solid var(--vinus-border);
            border-radius: 1.25rem;
            background: rgba(10, 10, 13, 0.76);
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025);
        }

        .server-route-content > * {
            min-width: 0;
        }
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
        background-color: #0d0d11 !important;
    }

    .bg-neutral-800,
    .bg-gray-800 {
        background-color: #151519 !important;
    }

    .bg-neutral-700,
    .bg-gray-700 {
        background-color: #1b1b21 !important;
    }

    .border-neutral-600,
    .border-gray-600,
    .border-neutral-700,
    .border-gray-700 {
        border-color: rgba(255, 255, 255, 0.09) !important;
    }

    .shadow-lg,
    .shadow-md {
        box-shadow: 0 16px 38px rgba(0, 0, 0, 0.2) !important;
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
