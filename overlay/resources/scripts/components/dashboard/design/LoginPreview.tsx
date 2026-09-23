import React from 'react';
import { Formik } from 'formik';
import LoginFormContainer from '@/components/auth/LoginFormContainer';
import { useDesignPreview } from '@/designRuntime';
import { vt } from '@/locales/translate';
export default function LoginPreview() {
    useDesignPreview(true);
    return <Formik initialValues={{}} onSubmit={() => undefined}><LoginFormContainer title={vt('Connexion')}><label>{vt('Adresse e-mail')}<input className="vinus-login-preview-field" disabled placeholder="demo@example.com" /></label><label>{vt('Mot de passe')}<input className="vinus-login-preview-field" disabled type="password" placeholder="••••••••••••" /></label><button className="vinus-login-preview-button" type="button" disabled>{vt('Connexion')}</button></LoginFormContainer></Formik>;
}
