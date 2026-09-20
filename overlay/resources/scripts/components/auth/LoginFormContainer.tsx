import React, { forwardRef } from 'react';
import { Form } from 'formik';
import styled from 'styled-components/macro';
import { breakpoint, VINUS } from '@/theme';
import FlashMessageRender from '@/components/FlashMessageRender';
import tw from 'twin.macro';

type Props = React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement> & {
    title?: string;
};

const Container = styled.div`
    ${tw`mx-auto w-full px-4`};
    max-width: 920px;

    ${breakpoint('md')`
        ${tw`px-8`}
    `};
`;

const AuthCard = styled.div`
    ${tw`grid w-full overflow-hidden rounded-2xl border`};
    grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
    background: #0e1622;
    border-color: rgba(126, 144, 163, 0.2);
    box-shadow: 0 32px 90px rgba(0, 0, 0, 0.38), 0 0 90px rgba(var(--vinus-accent-rgb), 0.08);

    @media (max-width: 767px) {
        grid-template-columns: 1fr;
    }
`;

const AuthIntro = styled.div`
    ${tw`relative hidden flex-col justify-between overflow-hidden p-8 md:flex`};
    min-height: 480px;
    background: radial-gradient(circle at 20% 12%, rgba(var(--vinus-accent-rgb), 0.22), transparent 46%),
        linear-gradient(145deg, #101f30, #09111a);
    border-right: 1px solid rgba(126, 144, 163, 0.14);

    &::after {
        content: '';
        ${tw`absolute -bottom-24 -right-24 h-64 w-64 rounded-full`};
        border: 1px solid rgba(var(--vinus-accent-rgb), 0.22);
        box-shadow: 0 0 80px rgba(var(--vinus-accent-rgb), 0.1);
    }
`;

const AuthMark = styled.div`
    ${tw`relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border`};
    background: linear-gradient(145deg, rgba(var(--vinus-accent-rgb), 0.18), rgba(8, 13, 20, 0.68));
    border-color: rgba(var(--vinus-accent-rgb), 0.34);
    box-shadow: 0 0 40px rgba(var(--vinus-accent-rgb), 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08);

    & > img {
        ${tw`h-[4.5rem] w-[4.5rem] object-contain`};
        filter: drop-shadow(0 8px 12px rgba(var(--vinus-accent-rgb), 0.18));
    }
`;

const AuthFields = styled.div`
    ${tw`flex min-w-0 flex-col justify-center p-6 sm:p-9`};
`;

export default forwardRef<HTMLFormElement, Props>(({ title, ...props }, ref) => (
    <Container>
        <FlashMessageRender css={tw`mb-2 px-1`} />
        <Form {...props} ref={ref}>
            <AuthCard>
                <AuthIntro>
                    <AuthMark>
                        <img src={VINUS.logo} alt={''} aria-hidden={'true'} />
                    </AuthMark>
                    <div css={tw`relative z-10`}>
                        <h1 css={tw`max-w-xs text-3xl font-semibold leading-tight text-neutral-50`}>
                            Votre infrastructure, en un coup d’œil.
                        </h1>
                        <p css={tw`mt-3 max-w-sm text-sm leading-relaxed text-neutral-300`}>
                            {VINUS.name} réunit consoles, fichiers et ressources dans un espace rapide, lisible et
                            sécurisé.
                        </p>
                    </div>
                </AuthIntro>
                <AuthFields>
                    {title && <h2 css={tw`mb-6 text-2xl font-semibold text-neutral-50`}>{title}</h2>}
                    {props.children}
                </AuthFields>
            </AuthCard>
        </Form>
        <p css={tw`text-center text-neutral-500 text-xs mt-4`}>
            &copy; 2015 - {new Date().getFullYear()}&nbsp;
            <a
                rel={'noopener nofollow noreferrer'}
                href={'https://pterodactyl.io'}
                target={'_blank'}
                css={tw`no-underline text-neutral-500 hover:text-neutral-300`}
            >
                Pterodactyl Software
            </a>
        </p>
    </Container>
));
