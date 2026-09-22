import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { VINUS } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & { title?: string };

const Stage = styled.div`
    ${tw`flex min-h-screen flex-col px-5 py-7 sm:px-10`};
    background: #111315;
`;

const Brand = styled.div`
    ${tw`mx-auto flex w-full max-w-6xl items-center gap-3`};
    img {
        ${tw`h-9 w-9 object-contain`};
    }
    strong {
        ${tw`text-base font-semibold text-neutral-100`};
    }
    span {
        ${tw`ml-auto text-xs text-neutral-400`};
    }
`;

const Shell = styled.div`
    ${tw`mx-auto flex w-full max-w-6xl flex-1 items-center py-12`};
    form {
        ${tw`grid w-full items-center gap-12 lg:grid-cols-2 lg:gap-20`};
    }
`;

const Editorial = styled.section`
    ${tw`hidden lg:block`};
    h1 {
        ${tw`mt-6 max-w-lg text-5xl font-medium leading-[1.1] text-neutral-50`};
        letter-spacing: -0.045em;
    }
    p {
        ${tw`mt-5 max-w-sm text-base leading-relaxed text-neutral-400`};
    }
    .eyebrow {
        ${tw`text-xs font-medium uppercase tracking-[0.16em] text-primary-300`};
    }
`;

const AuthPanel = styled.section`
    ${tw`mx-auto w-full max-w-md rounded-2xl border p-6 sm:p-9`};
    background: var(--vinus-glass);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: var(--vinus-glass-shadow);
    h2 {
        ${tw`mb-3 text-2xl font-semibold text-neutral-50`};
    }
    .form-caption {
        ${tw`mb-7 text-sm leading-relaxed text-neutral-400`};
    }
    .auth-label {
        ${tw`mb-5 text-xs font-medium text-primary-300`};
    }
`;

const Footer = styled.footer`
    ${tw`mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-3 border-t pt-5 text-xs text-neutral-400`};
    border-color: var(--vinus-border);
    a {
        ${tw`text-neutral-400 no-underline hover:text-neutral-100`};
    }
`;

export default forwardRef<HTMLFormElement, Props>(({ title, children, ...props }, ref) => (
    <Stage>
        <Brand>
            <img src={VINUS.logo} alt={''} aria-hidden={'true'} />
            <strong>{VINUS.name}</strong>
            <span>Panel de gestion</span>
        </Brand>
        <Shell>
            <Form {...props} ref={ref}>
                <Editorial>
                    <span className={'eyebrow'}>Votre espace, simplement.</span>
                    <h1>
                        Vos serveurs.
                        <br />
                        Les idées qui vont avec.
                    </h1>
                    <p>
                        Console, fichiers, sauvegardes. Tout ce qu’il faut pour faire vivre vos projets, au même
                        endroit.
                    </p>
                </Editorial>
                <AuthPanel>
                    <p className={'auth-label'}>{VINUS.name} / Compte</p>
                    {title && <h2>{title}</h2>}
                    <p className={'form-caption'}>Accédez à votre espace de gestion.</p>
                    <FlashMessageRender css={tw`mb-4`} />
                    {children}
                </AuthPanel>
            </Form>
        </Shell>
        <Footer>
            <span>{VINUS.name}</span>
            <a href={'https://pterodactyl.io'} target={'_blank'} rel={'noopener noreferrer'}>
                Propulsé par Pterodactyl
            </a>
        </Footer>
    </Stage>
));
