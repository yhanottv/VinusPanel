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
        --vinus-surface: #101b27;
        --vinus-surface-strong: #0e1622;
        --vinus-border: rgba(126, 144, 163, 0.16);
    }

    @font-face {
        font-family: 'IBM Plex Sans';
        font-style: normal;
        font-display: swap;
        font-weight: 100 700;
        src: url(${font}) format('woff2-variations');
        unicode-range: U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD;
    }

    body {
        ${tw`font-sans text-neutral-200`};
        min-height: 100vh;
        background-color: #080d14;
        background-image:
            radial-gradient(circle at 50% -12rem, rgba(var(--vinus-accent-rgb), 0.13), transparent 34rem),
            linear-gradient(180deg, #080d14 0%, #0b131d 52%, #080d14 100%);
        background-attachment: fixed;
        letter-spacing: 0.006em;
        font-feature-settings: 'tnum' 1, 'cv02' 1, 'cv03' 1;
    }

    h1, h2, h3, h4, h5, h6 {
        ${tw`font-medium font-header`};
        letter-spacing: -0.018em;
    }

    p {
        ${tw`text-neutral-200 leading-snug font-sans`};
    }

    form {
        ${tw`m-0`};
    }

    textarea, select, input, button, button:focus, button:focus-visible {
        ${tw`outline-none`};
    }

    ::selection {
        color: #f8fbff;
        background: rgba(var(--vinus-accent-rgb), 0.35);
    }

    a, button {
        -webkit-tap-highlight-color: transparent;
    }

    .server-layout {
        min-width: 0;
    }

    .server-route-content {
        min-width: 0;
    }

    @media (min-width: 1024px) {
        .server-layout {
            display: grid;
            grid-template-columns: 14.5rem minmax(0, 1fr);
            gap: 1.5rem;
            width: 100%;
            max-width: 1680px;
            margin: 0 auto;
            padding: 0 1.25rem;
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

    /* Scroll Bar Style */
    ::-webkit-scrollbar {
        background: none;
        width: 11px;
        height: 11px;
    }

    ::-webkit-scrollbar-thumb {
        border: solid 0 rgb(0 0 0 / 0%);
        border: 3px solid transparent;
        border-radius: 999px;
        background: #516579;
        background-clip: padding-box;
    }

    ::-webkit-scrollbar-track-piece {
        margin: 4px 0;
    }

    ::-webkit-scrollbar-thumb:horizontal {
        border-width: 3px;
    }

    ::-webkit-scrollbar-corner {
        background: transparent;
    }
`;
