import LanguageSelector from '@/components/elements/LanguageSelector';
import { vt } from '@/locales/translate';
import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { useDesign } from '@/designRuntime';
import './design-auth.css';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & { title?: string };

// Source URLs and ownership for these real game banners are listed in docs/GAME-BANNERS.md.
const gameColumns = [
    ['rdr2', 'hytale', 'arma3', 'rust', 'gta-v', 'dayz', 'ark', 'cs2', 'palworld', 'conan'],
    ['arma3', 'minecraft', 'gta-v', 'zomboid', 'hytale', 'terraria', 'rust', 'dayz', 'valheim', 'garrys-mod'],
    ['palworld', 'hytale', 'rust', 'zomboid', 'minecraft', 'rdr2', 'seven-days', 'ark', 'terraria', 'cs2'],
    ['gta-v', 'arma3', 'rdr2', 'minecraft', 'zomboid', 'palworld', 'dayz', 'conan', 'hytale', 'rust'],
    ['ark', 'rust', 'minecraft', 'gta-v', 'hytale', 'valheim', 'garrys-mod', 'seven-days', 'palworld', 'rdr2'],
];

const Stage = styled.div`
    position: relative;
    display: flex;
    min-height: 100vh;
    min-height: 100dvh;
    flex-direction: column;
    overflow: hidden;
    background: var(--vinus-bg, #0e1014);
    color: #f5f5f7;

    &::before, &::after {
        content: '';
        position: absolute;
        z-index: 1;
        inset: 0;
        pointer-events: none;
    }
    &::before { background: linear-gradient(90deg, #0e1014 0%, #0e1014 26%, rgba(14,16,20,.98) 39%, rgba(14,16,20,.35) 70%, transparent 88%); }
    &::after { background: linear-gradient(0deg, #0e1014, rgba(14,16,20,.7) 11%, transparent 38%), linear-gradient(180deg, rgba(14,16,20,.64), transparent 20%); }

    @media (max-width: 900px) {
        &::before { background: linear-gradient(90deg, #0e1014, rgba(14,16,20,.97) 52%, rgba(14,16,20,.79)); }
    }
`;

const Mosaic = styled.div`
    position: absolute;
    inset: -25% -4vw -25% auto;
    width: min(64vw, 1310px);
    display: flex;
    gap: 16px;
    pointer-events: none;
    transform: perspective(1400px) rotateY(-8deg) rotateZ(-9deg) scale(1.04);
    transform-origin: 65% 48%;

    .game-column {
        position: relative;
        display: flex;
        flex: 1 1 0;
        min-width: 0;
        flex-direction: column;
        align-self: flex-start;
        gap: 16px;
        animation: vinus-game-scroll 56s linear infinite;
        will-change: transform;
    }
    .game-column:nth-child(1) { top: -310px; animation-delay: -11s; }
    .game-column:nth-child(2) { top: -220px; animation-duration: 49s; animation-delay: -19s; }
    .game-column:nth-child(3) { top: -350px; animation-duration: 63s; animation-delay: -31s; }
    .game-column:nth-child(4) { top: -170px; animation-duration: 53s; animation-delay: -7s; }
    .game-column:nth-child(5) { top: -390px; animation-duration: 59s; animation-delay: -25s; }
    .game-sequence { display: flex; flex-direction: column; gap: 16px; flex: none; }
    .game-tile {
        width: 100%;
        aspect-ratio: 460 / 215;
        min-height: 10vh;
        min-height: 10dvh;
        flex: none;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 13px;
        background: #1a1e25;
        box-shadow: 0 16px 32px rgba(0,0,0,.35);
    }
    img { display: block; width: 100%; height: 100%; object-fit: cover; }
    /* Four copies keep the entire viewport covered while one copy scrolls out. */
    @keyframes vinus-game-scroll { to { transform: translateY(calc(-25% - 4px)); } }

    @media (max-width: 900px) { inset: -10% -42% -10% auto; width: 125vw; opacity: .43; }
    @media (max-width: 600px) { inset: -8% -130% -8% auto; width: 205vw; opacity: .28; }
    @media (prefers-reduced-motion: reduce) { .game-column { animation: none; will-change: auto; } }
`;

const LanguageDock = styled.div`
    position: absolute;
    z-index: 3;
    top: clamp(20px, 3vw, 42px);
    right: clamp(20px, 3.5vw, 58px);
`;

const Shell = styled.main`
    position: relative;
    z-index: 2;
    display: flex;
    width: 100%;
    min-height: 680px;
    flex: 1;
    align-items: center;
    padding: 96px clamp(24px, 2.2vw, 52px) 90px;
    form { display: flex; width: min(100%, 420px); flex-direction: column; align-items: stretch; transform: translateY(-45px); }
    @media (max-width: 600px) { min-height: 0; padding: 110px 24px 80px; form { transform: none; } }
`;

const Brand = styled.div`
    display: flex;
    align-items: center;
    gap: 13px;
    margin-bottom: clamp(38px, 4vh, 48px);
    img { width: 47px; height: 47px; object-fit: contain; filter: drop-shadow(0 0 16px rgba(var(--vinus-accent-rgb), .28)); }
    strong { color: #fff; font-size: 1.36rem; font-weight: 750; letter-spacing: -.045em; }
    @media (max-width: 600px) { margin-bottom: 52px; }
`;

const AuthPanel = styled.section`
    h1 { margin: 0 0 9px; color: #f7f8fa; font-size: clamp(1.8rem, 2.3vw, 2.35rem); font-weight: 720; letter-spacing: -.045em; line-height: 1.15; }
    .form-caption { margin: 0 0 34px; color: #a1a9b8; font-size: .91rem; line-height: 1.6; }
    label { color: #b8c0cd; font-size: .8rem; font-weight: 600; letter-spacing: .01em; }
    input:not([type='checkbox']):not([type='radio']) {
        min-height: 48px;
        border: 1px solid #343b47;
        border-radius: 11px;
        background: #1a1f27;
        color: #f7f8fa;
        font-size: .94rem;
        box-shadow: none;
        &:hover:not(:disabled) { border-color: #687384; }
        &:focus-visible { border-color: var(--vinus-accent); box-shadow: 0 0 0 3px rgba(var(--vinus-accent-rgb), .19); }
    }
    button[type='submit'] {
        min-height: 50px;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 11px;
        background: var(--vinus-accent);
        color: #111317;
        font-size: .93rem;
        font-weight: 750;
        transition: transform .18s ease, filter .18s ease, box-shadow .18s ease;
        &:hover:not(:disabled) { transform: translateY(-2px); filter: brightness(1.09); box-shadow: 0 10px 28px rgba(var(--vinus-accent-rgb), .22); }
    }
    a { color: #b5bdca; text-decoration: none; transition: color .15s ease; &:hover { color: #fff; } }
    @media (prefers-reduced-motion: reduce) {
        button[type='submit'], a { transition: none; }
        button[type='submit']:hover:not(:disabled) { transform: none; }
    }
`;

const ArtCaption = styled.div`
    position: absolute;
    z-index: 2;
    left: 43.5vw;
    bottom: clamp(66px, 9vh, 112px);
    width: min(29vw, 430px);
    pointer-events: none;
    strong { display: block; max-width: 360px; color: #f5f6f8; font-size: clamp(1.5rem, 2.35vw, 2.65rem); font-weight: 750; letter-spacing: -.05em; line-height: 1.1; text-wrap: balance; }
    span { display: block; max-width: 390px; margin-top: 14px; color: #b4bdc9; font-size: .9rem; line-height: 1.55; }
    @media (max-width: 900px) { display: none; }
`;

const Footer = styled.footer`
    position: relative;
    z-index: 2;
    display: flex;
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px;
    padding: 0 clamp(24px, 2.2vw, 52px) 24px;
    color: #737d8d;
    font-size: .72rem;
    a { color: #8893a3; text-decoration: none; }
    a:hover { color: #fff; }
`;

export default forwardRef<HTMLFormElement, Props>(({ title, children, ...props }, ref) => {
    const design = useDesign();
    const o = design.options;
    return (
    <Stage className="vinus-auth-stage">
        <Mosaic className="vinus-auth-mosaic" aria-hidden={'true'}>
            {gameColumns.map((games, column) => (
                <div className={'game-column'} key={column}>
                    {[0, 1, 2, 3].map((copy) => (
                        <div className={'game-sequence'} key={copy}>
                            {games.map((game, row) => (
                                <div className={'game-tile'} key={`${game}-${row}`}>
                                    <img src={`/assets/images/vinus/login-games/${game}.jpg`} alt={''} draggable={false} decoding={'async'} />
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            ))}
        </Mosaic>
        <LanguageDock className="vinus-auth-language"><LanguageSelector /></LanguageDock>
        <Shell className="vinus-auth-shell">
            <Form {...props} ref={ref}>
                <Brand className="vinus-auth-brand"><img src={design.logo} alt={''} aria-hidden={'true'} /><strong>{design.brand_name}</strong></Brand>
                <AuthPanel className="vinus-auth-panel">
                    {title && <h1>{title}</h1>}
                    <p className={'form-caption'}>{vt("Accédez à vos serveurs, consoles et fichiers.")}</p>
                    <FlashMessageRender css={tw`mb-4`} />
                    {children}
                </AuthPanel>
            </Form>
        </Shell>
        <ArtCaption className="vinus-auth-editorial">
            <strong>{o.login_heading || vt("Vos serveurs. Un seul panel.")}</strong>
            <span>{o.login_description || vt("Tous vos mondes et vos communautés réunis au même endroit.")}</span>
        </ArtCaption>
        <Footer className="vinus-auth-footer">
            <span>{o.login_footnote || design.brand_name}</span>
            <a href={'https://pterodactyl.io'} target={'_blank'} rel={'noopener noreferrer'}>{vt("Propulsé par Pterodactyl")}</a>
        </Footer>
    </Stage>
); });
