import React from 'react';
import BeforeContent from '@blueprint/components/Account/Overview/BeforeContent';
import AfterContent from '@blueprint/components/Account/Overview/AfterContent';
import { vt } from '@/locales/translate';
import UpdatePasswordForm from '@/components/dashboard/forms/UpdatePasswordForm';
import UpdateEmailAddressForm from '@/components/dashboard/forms/UpdateEmailAddressForm';
import ConfigureTwoFactorForm from '@/components/dashboard/forms/ConfigureTwoFactorForm';
import PageContentBlock from '@/components/elements/PageContentBlock';
import MessageBox from '@/components/MessageBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import { useLocation } from 'react-router-dom';
import { useStoreState } from '@/state/hooks';
import AccountPicture from './account/AccountPicture';
import styles from './account/account.module.css';

export default function AccountOverviewContainer() {
    const { state } = useLocation<undefined | { twoFactorRedirect?: boolean }>();
    const protectedAccount = useStoreState(s=>s.user.data?.useTotp);
    return <PageContentBlock title={vt('Compte | VinusPanel')} className={styles.page}>
        <BeforeContent/>
        <header className={styles.heading}><h1>{vt('Votre compte')}</h1><p>{vt('Vos informations de connexion et la sécurité de votre compte.')}</p></header>
        {state?.twoFactorRedirect&&<MessageBox title={vt('Authentification requise')} type="error">{vt('Activez la double authentification pour pouvoir continuer.')}</MessageBox>}
        <AccountPicture/>
        <section className={`${styles.section} ${styles.formSection}`} aria-labelledby="account-email-title">
            <header><h2 id="account-email-title">{vt('Adresse e-mail')}</h2><p>{vt('Votre adresse de connexion et de réception des messages du panel.')}</p></header>
            <FlashMessageRender byKey="account:email"/><UpdateEmailAddressForm/>
        </section>
        <section className={`${styles.section} ${styles.formSection}`} aria-labelledby="account-password-title">
            <header><h2 id="account-password-title">{vt('Mot de passe')}</h2><p>{vt('Choisissez un mot de passe unique d’au moins 8 caractères.')}</p></header>
            <FlashMessageRender byKey="account:password"/><UpdatePasswordForm/>
        </section>
        <section className={`${styles.section} ${styles.twoFactor}`} aria-labelledby="account-2fa-title">
            <header><h2 id="account-2fa-title">{vt('Double authentification')}<span className={styles.status} data-enabled={!!protectedAccount}>{vt(protectedAccount?'Activée':'Désactivée')}</span></h2></header>
            <FlashMessageRender byKey="account:two-step"/><ConfigureTwoFactorForm/>
        </section>
        <AfterContent/>
    </PageContentBlock>;
}
