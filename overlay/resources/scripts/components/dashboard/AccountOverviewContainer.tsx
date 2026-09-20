import * as React from 'react';
import ContentBox from '@/components/elements/ContentBox';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import styled from 'styled-components/macro';
import tw from 'twin.macro';
import MessageBox from '@/components/MessageBox';
import { useLocation } from 'react-router-dom';
import { useStoreState } from 'easy-peasy';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faKey, faShieldAlt, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

const AccountHeader = styled.header`
    ${tw`mb-7 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between`};
    border-color: rgba(255, 255, 255, 0.07);

    .identity {
        ${tw`flex min-w-0 items-center`};
    }

    .avatar {
        ${tw`mr-4 flex h-12 w-12 flex-none items-center justify-center rounded-xl text-primary-300`};
        background: rgba(255, 122, 26, 0.1);
        border: 1px solid rgba(255, 122, 26, 0.2);
    }

    h1 {
        ${tw`text-2xl font-semibold text-neutral-50 sm:text-3xl`};
    }

    p {
        ${tw`mt-1 truncate text-sm text-neutral-400`};
    }

    .security-label {
        ${tw`inline-flex items-center self-start rounded-lg border px-3 py-2 text-xs font-semibold text-neutral-300`};
        background: rgba(255, 255, 255, 0.025);
        border-color: rgba(255, 255, 255, 0.08);
    }
`;

const AccountGrid = styled.div`
    ${tw`grid grid-cols-1 gap-5 xl:grid-cols-3`};

    & > div {
        ${tw`min-w-0`};
    }
`;

const SectionTitle = ({ icon, children }: { icon: IconProp; children: React.ReactNode }) => (
    <span css={tw`flex items-center`}>
        <span css={tw`mr-2.5 flex h-7 w-7 items-center justify-center rounded-md bg-primary-500 bg-opacity-10`}>
            <FontAwesomeIcon icon={icon} css={tw`text-xs text-primary-300`} />
        </span>
        {children}
    </span>
);

export default () => {
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();
    const user = useStoreState((state: any) => state.user.data);

    return (
        <PageContentBlock title={'Compte | VinusPanel'}>
            <AccountHeader>
                <div className={'identity'}>
                    <div className={'avatar'}>
                        <FontAwesomeIcon icon={faUserCircle} size={'lg'} />
                    </div>
                    <div className={'min-w-0'}>
                        <h1>Votre compte</h1>
                        <p>{user?.email || 'Gérez vos informations et la sécurité de votre compte.'}</p>
                    </div>
                </div>
                <span className={'security-label'}>
                    <FontAwesomeIcon icon={faShieldAlt} css={tw`mr-2 text-green-400`} />
                    Centre de sécurité
                </span>
            </AccountHeader>

            {state?.twoFactorRedirect && (
                <MessageBox title={'Authentification requise'} type={'error'}>
                    Activez la double authentification pour pouvoir continuer.
                </MessageBox>
            )}

            <AccountGrid css={state?.twoFactorRedirect ? tw`mt-5` : undefined}>
                <ContentBox
                    title={<SectionTitle icon={faKey}>Mot de passe</SectionTitle>}
                    showFlashes={'account:password'}
                >
                    <UpdatePasswordForm />
                </ContentBox>
                <ContentBox
                    title={<SectionTitle icon={faEnvelope}>Adresse e-mail</SectionTitle>}
                    showFlashes={'account:email'}
                >
                    <UpdateEmailAddressForm />
                </ContentBox>
                <ContentBox title={<SectionTitle icon={faShieldAlt}>Double authentification</SectionTitle>}>
                    <ConfigureTwoFactorForm />
                </ContentBox>
            </AccountGrid>
        </PageContentBlock>
    );
};
