import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled, { keyframes } from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faChartLine, faCircle, faServer, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { VINUS } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & { title?: string };

const drift = keyframes`
    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
    50% { transform: translate3d(2.5rem, -1.5rem, 0) scale(1.08); }
`;
const rotate = keyframes`to { transform: rotate(360deg); }`;
const float = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
`;
const pulse = keyframes`
    0%, 100% { opacity: .42; transform: scale(.96); }
    50% { opacity: .85; transform: scale(1.04); }
`;

const Stage = styled.div`
    ${tw`relative flex min-h-screen w-full items-center overflow-hidden px-4 py-8 sm:px-6 lg:px-10`};
    background: radial-gradient(circle at 16% 18%, rgba(255, 122, 26, 0.1), transparent 28rem),
        radial-gradient(circle at 86% 82%, rgba(255, 122, 26, 0.055), transparent 24rem), #070708;

    &::before {
        content: '';
        ${tw`pointer-events-none absolute inset-0`};
        opacity: 0.34;
        background-image: linear-gradient(rgba(255, 255, 255, 0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.018) 1px, transparent 1px);
        background-size: 4.5rem 4.5rem;
        mask-image: radial-gradient(circle at center, #000 0%, transparent 72%);
    }

    @media (prefers-reduced-motion: reduce) {
        &,
        *,
        *::before,
        *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
        }
    }
`;

const Glow = styled.span<{ $right?: boolean }>`
    ${tw`pointer-events-none absolute rounded-full`};
    width: 28rem;
    height: 28rem;
    left: ${({ $right }) => ($right ? 'auto' : '-11rem')};
    right: ${({ $right }) => ($right ? '-12rem' : 'auto')};
    top: ${({ $right }) => ($right ? '52%' : '-12rem')};
    background: rgba(255, 122, 26, ${({ $right }) => ($right ? '0.055' : '0.075')});
    filter: blur(80px);
    animation: ${drift} ${({ $right }) => ($right ? '11s' : '13s')} ease-in-out infinite;
`;

const Shell = styled.div`
    ${tw`relative z-10 mx-auto w-full`};
    max-width: 1240px;
`;
const TopBar = styled.div`
    ${tw`mb-6 flex items-center justify-between px-1`};
`;

const Brand = styled.div`
    ${tw`flex items-center`};
    img {
        ${tw`mr-3 h-11 w-11 rounded-xl border object-contain p-0.5`};
        background: rgba(255, 122, 26, 0.08);
        border-color: rgba(255, 122, 26, 0.22);
    }
    strong,
    span {
        ${tw`block`};
    }
    strong {
        ${tw`text-sm font-semibold text-neutral-50`};
    }
    span {
        ${tw`mt-0.5 text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-neutral-500`};
    }
`;

const Status = styled.span`
    ${tw`hidden items-center rounded-full border px-3 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.13em] text-neutral-400 sm:inline-flex`};
    background: rgba(255, 255, 255, 0.025);
    border-color: rgba(255, 255, 255, 0.07);
    svg {
        ${tw`mr-2 text-[0.45rem] text-green-400`};
        filter: drop-shadow(0 0 5px rgba(52, 211, 153, 0.65));
    }
`;

const Layout = styled.div`
    ${tw`grid w-full items-stretch gap-5 lg:grid-cols-[minmax(0,1fr)_27rem] lg:gap-10`};
`;

const Scene = styled.section`
    ${tw`relative hidden min-h-[36rem] overflow-hidden rounded-[2rem] border p-8 lg:flex lg:flex-col lg:justify-between xl:p-11`};
    background: radial-gradient(circle at 52% 34%, rgba(255, 122, 26, 0.12), transparent 15rem),
        linear-gradient(145deg, rgba(20, 20, 25, 0.96), rgba(10, 10, 13, 0.98));
    border-color: rgba(255, 255, 255, 0.075);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.025), 0 30px 80px rgba(0, 0, 0, 0.28);
`;

const Visual = styled.div`
    ${tw`relative mx-auto h-72 w-72`};
    .orbit-a,
    .orbit-b {
        ${tw`absolute rounded-full border`};
        border-color: rgba(255, 122, 26, 0.18);
    }
    .orbit-a {
        ${tw`inset-3`};
        border-style: dashed;
        animation: ${rotate} 24s linear infinite;
    }
    .orbit-b {
        ${tw`inset-9`};
        border-color: rgba(255, 255, 255, 0.08);
        animation: ${rotate} 18s linear infinite reverse;
    }
    .core {
        ${tw`absolute inset-[4.5rem] flex items-center justify-center overflow-hidden rounded-[2rem] border`};
        background: linear-gradient(145deg, rgba(255, 122, 26, 0.16), rgba(10, 10, 13, 0.92));
        border-color: rgba(255, 122, 26, 0.3);
        box-shadow: 0 0 70px rgba(255, 122, 26, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.08);
        animation: ${float} 6s ease-in-out infinite;
        img {
            ${tw`h-28 w-28 object-contain`};
            filter: drop-shadow(0 12px 24px rgba(255, 122, 26, 0.25));
        }
    }
    .node {
        ${tw`absolute flex h-10 w-10 items-center justify-center rounded-xl border text-xs text-primary-300`};
        background: #17171c;
        border-color: rgba(255, 255, 255, 0.09);
        box-shadow: 0 12px 28px rgba(0, 0, 0, 0.32);
        animation: ${pulse} 5s ease-in-out infinite;
    }
    .node-one {
        left: 0.5rem;
        top: 7rem;
    }
    .node-two {
        right: 1rem;
        top: 2rem;
        animation-delay: -1.5s;
    }
    .node-three {
        bottom: 1rem;
        right: 3.25rem;
        animation-delay: -3s;
    }
`;

const SceneCopy = styled.div`
    ${tw`relative z-10`};
    h1 {
        ${tw`max-w-xl text-4xl font-semibold leading-[1.08] text-neutral-50 xl:text-5xl`};
        letter-spacing: -0.05em;
    }
    > p:last-of-type {
        ${tw`mt-4 max-w-lg text-sm leading-relaxed text-neutral-400`};
    }
`;

const MiniStats = styled.div`
    ${tw`mt-7 grid grid-cols-3 gap-2`};
    div {
        ${tw`rounded-xl border px-3 py-3`};
        background: rgba(255, 255, 255, 0.025);
        border-color: rgba(255, 255, 255, 0.065);
    }
    svg {
        ${tw`mb-2 text-primary-300`};
    }
    strong,
    span {
        ${tw`block`};
    }
    strong {
        ${tw`text-xs font-semibold text-neutral-200`};
    }
    span {
        ${tw`mt-1 text-[0.65rem] text-neutral-500`};
    }
`;

const AuthPanel = styled.section`
    ${tw`relative flex min-h-[36rem] flex-col justify-center overflow-hidden rounded-[2rem] border p-6 sm:p-9 lg:p-10`};
    background: rgba(18, 18, 23, 0.92);
    border-color: rgba(255, 255, 255, 0.085);
    box-shadow: 0 35px 90px rgba(0, 0, 0, 0.42), inset 0 1px 0 rgba(255, 255, 255, 0.035);
    backdrop-filter: blur(24px);
    &::before {
        content: '';
        ${tw`pointer-events-none absolute left-12 right-12 top-0 h-px`};
        background: linear-gradient(90deg, transparent, #ff7a1a, transparent);
        box-shadow: 0 0 28px rgba(255, 122, 26, 0.45);
    }
`;

const MobileBrand = styled.div`
    ${tw`mb-8 flex items-center lg:hidden`};
    img {
        ${tw`mr-3 h-12 w-12 rounded-xl object-contain`};
    }
`;
const TrustRow = styled.div`
    ${tw`mt-7 flex items-center justify-center gap-4 border-t pt-5 text-[0.65rem] text-neutral-600`};
    border-color: rgba(255, 255, 255, 0.06);
    span {
        ${tw`inline-flex items-center`};
    }
    svg {
        ${tw`mr-1.5 text-primary-300`};
    }
`;
const Footer = styled.p`
    ${tw`mt-5 text-center text-[0.68rem] text-neutral-600`};
`;
export default forwardRef<HTMLFormElement, Props>(({ title, children, ...props }, ref) => (
    <Stage>
        <Glow aria-hidden={'true'} />
        <Glow $right aria-hidden={'true'} />
        <Shell>
            <TopBar>
                <Brand>
                    <img src={VINUS.logo} alt={''} aria-hidden={'true'} />
                    <div>
                        <strong>{VINUS.name}</strong>
                        <span>Infrastructure console</span>
                    </div>
                </Brand>
                <Status>
                    <FontAwesomeIcon icon={faCircle} /> Systèmes opérationnels
                </Status>
            </TopBar>
            <FlashMessageRender css={tw`mb-3 px-1`} />
            <Form {...props} ref={ref}>
                <Layout>
                    <Scene>
                        <Visual aria-hidden={'true'}>
                            <span className={'orbit-a'} />
                            <span className={'orbit-b'} />
                            <div className={'core'}>
                                <img src={VINUS.logo} alt={''} />
                            </div>
                            <span className={'node node-one'}>
                                <FontAwesomeIcon icon={faServer} />
                            </span>
                            <span className={'node node-two'}>
                                <FontAwesomeIcon icon={faBolt} />
                            </span>
                            <span className={'node node-three'}>
                                <FontAwesomeIcon icon={faShieldAlt} />
                            </span>
                        </Visual>
                        <SceneCopy>
                            <p css={tw`mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300`}>
                                Centre de contrôle
                            </p>
                            <h1>Votre infrastructure, toujours en mouvement.</h1>
                            <p>
                                Supervisez vos instances, ressources et accès depuis un espace unique, rapide et
                                sécurisé.
                            </p>
                            <MiniStats>
                                <div>
                                    <FontAwesomeIcon icon={faBolt} />
                                    <strong>Temps réel</strong>
                                    <span>Console live</span>
                                </div>
                                <div>
                                    <FontAwesomeIcon icon={faChartLine} />
                                    <strong>Lisible</strong>
                                    <span>Métriques utiles</span>
                                </div>
                                <div>
                                    <FontAwesomeIcon icon={faShieldAlt} />
                                    <strong>Privé</strong>
                                    <span>Accès protégé</span>
                                </div>
                            </MiniStats>
                        </SceneCopy>
                    </Scene>
                    <AuthPanel>
                        <MobileBrand>
                            <img src={VINUS.logo} alt={''} aria-hidden={'true'} />
                            <div>
                                <p css={tw`font-semibold text-neutral-50`}>{VINUS.name}</p>
                                <p css={tw`text-xs text-neutral-500`}>Centre de contrôle</p>
                            </div>
                        </MobileBrand>
                        <p css={tw`mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-300`}>
                            Espace sécurisé
                        </p>
                        {title && <h2 css={tw`mb-2 text-3xl font-semibold text-neutral-50`}>{title}</h2>}
                        <p css={tw`mb-8 text-sm leading-relaxed text-neutral-400`}>
                            Connectez-vous pour retrouver vos serveurs et vos outils de gestion.
                        </p>
                        {children}
                        <TrustRow>
                            <span>
                                <FontAwesomeIcon icon={faShieldAlt} /> Connexion sécurisée
                            </span>
                            <span>
                                <FontAwesomeIcon icon={faBolt} /> Accès instantané
                            </span>
                        </TrustRow>
                    </AuthPanel>
                </Layout>
            </Form>
            <Footer>
                {VINUS.name}&nbsp;&middot;&nbsp; Propulsé par&nbsp;
                <a
                    rel={'noopener nofollow noreferrer'}
                    href={'https://pterodactyl.io'}
                    target={'_blank'}
                    css={tw`no-underline text-neutral-500 hover:text-neutral-300`}
                >
                    Pterodactyl
                </a>
            </Footer>
        </Shell>
    </Stage>
));
