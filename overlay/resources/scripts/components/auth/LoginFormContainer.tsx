import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faLayerGroup, faShieldAlt } from '@fortawesome/free-solid-svg-icons';
import { breakpoint, VINUS } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${tw`mx-auto w-full px-4`};
    max-width: 1120px;

    ${breakpoint('md')`
        ${tw`px-8`}
    `};
`;

const AuthCard = styled.div`
    ${tw`grid w-full overflow-hidden border`};
    grid-template-columns: minmax(0, 1.08fr) minmax(24rem, 0.92fr);
    border-radius: 1.75rem;
    background: rgba(11, 18, 28, 0.96);
    border-color: rgba(157, 176, 195, 0.2);
    box-shadow: 0 36px 110px rgba(0, 0, 0, 0.48), 0 0 120px rgba(var(--vinus-accent-rgb), 0.08);

    @media (max-width: 767px) {
        grid-template-columns: minmax(0, 1fr);
        border-radius: 1.35rem;
    }
`;

const AuthIntro = styled.section`
    ${tw`relative hidden flex-col justify-between overflow-hidden p-10 md:flex lg:p-12`};
    min-height: 540px;
    background: radial-gradient(circle at 18% 15%, rgba(var(--vinus-accent-rgb), 0.25), transparent 34%),
        linear-gradient(145deg, #132336 0%, #0b1723 54%, #08111a 100%);
    border-right: 1px solid rgba(157, 176, 195, 0.15);

    &::before {
        content: '';
        ${tw`pointer-events-none absolute inset-0`};
        background: url('/assets/images/vinus/eagle.png') right -4rem bottom -4.5rem / 29rem auto no-repeat;
        opacity: 0.085;
        transform: rotate(-3deg);
    }

    &::after {
        content: '';
        ${tw`pointer-events-none absolute -bottom-36 -right-28 h-96 w-96 rounded-full`};
        border: 1px solid rgba(var(--vinus-accent-rgb), 0.2);
        box-shadow: 0 0 110px rgba(var(--vinus-accent-rgb), 0.1);
    }
`;

const BrandLockup = styled.div`
    ${tw`relative z-10 flex items-center`};
`;

const AuthMark = styled.div`
    ${tw`flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-2xl border`};
    background: linear-gradient(145deg, rgba(var(--vinus-accent-rgb), 0.2), rgba(8, 13, 20, 0.78));
    border-color: rgba(var(--vinus-accent-rgb), 0.38);
    box-shadow: 0 0 42px rgba(var(--vinus-accent-rgb), 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08);

    & > img {
        ${tw`h-[4.5rem] w-[4.5rem] object-contain`};
        filter: drop-shadow(0 8px 14px rgba(var(--vinus-accent-rgb), 0.2));
    }
`;

const IntroContent = styled.div`
    ${tw`relative z-10 max-w-lg`};

    h1 {
        ${tw`text-4xl font-semibold leading-[1.08] text-neutral-50 lg:text-5xl`};
        letter-spacing: -0.045em;
    }
`;

const FeatureGrid = styled.div`
    ${tw`mt-8 grid gap-3 sm:grid-cols-3`};
`;

const Feature = styled.div`
    ${tw`rounded-xl border p-3`};
    background: rgba(5, 10, 16, 0.34);
    border-color: rgba(157, 176, 195, 0.14);
    backdrop-filter: blur(10px);

    svg {
        color: var(--vinus-accent-soft);
    }

    p {
        ${tw`mt-2 text-xs font-medium text-neutral-200`};
    }
`;

const AuthFields = styled.div`
    ${tw`relative flex min-w-0 flex-col justify-center p-6 sm:p-10 lg:p-12`};
    background: linear-gradient(160deg, rgba(15, 25, 37, 0.98), rgba(9, 15, 23, 0.98));

    &::before {
        content: '';
        ${tw`pointer-events-none absolute left-0 right-0 top-0 h-px`};
        background: linear-gradient(90deg, transparent, rgba(var(--vinus-accent-rgb), 0.55), transparent);
    }
`;

const MobileBrand = styled.div`
    ${tw`mb-8 flex items-center md:hidden`};

    img {
        ${tw`mr-3 h-12 w-12 object-contain`};
    }
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Container>
        <FlashMessageRender css={tw`mb-3 px-1`} />
        <Form {...props} ref={ref}>
            <AuthCard>
                <AuthIntro>
                    <BrandLockup>
                        <AuthMark>
                            <img src={VINUS.logo} alt={''} aria-hidden={'true'} />
                        </AuthMark>
                        <div css={tw`ml-4`}>
                            <p css={tw`text-lg font-semibold text-neutral-50`}>{VINUS.name}</p>
                            <p css={tw`mt-0.5 text-xs uppercase tracking-[0.2em] text-primary-300`}>Control center</p>
                        </div>
                    </BrandLockup>
                    <IntroContent>
                        <p css={tw`mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-primary-300`}>
                            Infrastructure simplifiée
                        </p>
                        <h1>Gardez le contrôle, sans perdre le fil.</h1>
                        <p css={tw`mt-5 max-w-md text-sm leading-relaxed text-neutral-300`}>
                            Une vue claire de vos instances, de leurs ressources et de toutes les actions essentielles.
                        </p>
                        <FeatureGrid>
                            <Feature>
                                <FontAwesomeIcon icon={faBolt} />
                                <p>Console en direct</p>
                            </Feature>
                            <Feature>
                                <FontAwesomeIcon icon={faLayerGroup} />
                                <p>Gestion centralisée</p>
                            </Feature>
                            <Feature>
                                <FontAwesomeIcon icon={faShieldAlt} />
                                <p>Accès sécurisé</p>
                            </Feature>
                        </FeatureGrid>
                    </IntroContent>
                </AuthIntro>
                <AuthFields>
                    <MobileBrand>
                        <img src={VINUS.logo} alt={''} aria-hidden={'true'} />
                        <div>
                            <p css={tw`text-lg font-semibold text-neutral-50`}>{VINUS.name}</p>
                            <p css={tw`text-xs text-neutral-400`}>Centre de contrôle</p>
                        </div>
                    </MobileBrand>
                    <p css={tw`mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary-300`}>
                        Accès personnel
                    </p>
                    {title && <h2 css={tw`mb-2 text-2xl font-semibold text-neutral-50`}>{title}</h2>}
                    <p css={tw`mb-7 text-sm leading-relaxed text-neutral-400`}>
                        Identifiez-vous pour accéder à votre espace de gestion.
                    </p>
                    {props.children}
                </AuthFields>
            </AuthCard>
        </Form>
        <p css={tw`mt-5 text-center text-xs text-neutral-500`}>
            {VINUS.name}&nbsp;&middot;&nbsp; Propulsé par&nbsp;
            <a
                rel={'noopener nofollow noreferrer'}
                href={'https://pterodactyl.io'}
                target={'_blank'}
                css={tw`no-underline text-neutral-500 hover:text-neutral-300`}
            >
                Pterodactyl
            </a>
        </p>
    </Container>
));
