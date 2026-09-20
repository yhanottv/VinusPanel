import React from 'react';
import { Actions, State, useStoreActions, useStoreState } from 'easy-peasy';
import { Form, Formik, FormikHelpers } from 'formik';
import Field from '@/components/elements/Field';
import * as Yup from 'yup';
import SpinnerOverlay from '@/components/elements/SpinnerOverlay';
import updateAccountPassword from '@/api/account/updateAccountPassword';
import { httpErrorToHuman } from '@/api/http';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';

interface Values {
    current: string;
    password: string;
    confirmPassword: string;
}

const schema = Yup.object().shape({
    current: Yup.string().min(1).required('Votre mot de passe actuel est requis.'),
    password: Yup.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').required(),
    confirmPassword: Yup.string().test('password', 'Les mots de passe ne correspondent pas.', function (value) {
        return value === this.parent.password;
    }),
});

export default () => {
    const user = useStoreState((state: State<ApplicationStore>) => state.user.data);
    const { clearFlashes, addFlash } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    if (!user) return null;

    const submit = (values: Values, { setSubmitting }: FormikHelpers<Values>) => {
        clearFlashes('account:password');
        updateAccountPassword({ ...values })
            .then(() => {
                // @ts-expect-error this is valid
                window.location = '/auth/login';
            })
            .catch((error) =>
                addFlash({
                    key: 'account:password',
                    type: 'error',
                    title: 'Erreur',
                    message: httpErrorToHuman(error),
                })
            )
            .then(() => setSubmitting(false));
    };

    return (
        <Formik
            onSubmit={submit}
            validationSchema={schema}
            initialValues={{ current: '', password: '', confirmPassword: '' }}
        >
            {({ isSubmitting, isValid }) => (
                <React.Fragment>
                    <SpinnerOverlay size={'large'} visible={isSubmitting} />
                    <Form css={tw`m-0`}>
                        <Field id={'current_password'} type={'password'} name={'current'} label={'Mot de passe actuel'} />
                        <div css={tw`mt-5`}>
                            <Field
                                id={'new_password'}
                                type={'password'}
                                name={'password'}
                                label={'Nouveau mot de passe'}
                                description={'Utilisez au moins 8 caractères et un mot de passe unique.'}
                            />
                        </div>
                        <div css={tw`mt-5`}>
                            <Field
                                id={'confirm_new_password'}
                                type={'password'}
                                name={'confirmPassword'}
                                label={'Confirmer le mot de passe'}
                            />
                        </div>
                        <div css={tw`mt-6`}>
                            <Button disabled={isSubmitting || !isValid}>Modifier le mot de passe</Button>
                        </div>
                    </Form>
                </React.Fragment>
            )}
        </Formik>
    );
};
