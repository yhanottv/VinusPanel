import { vt } from '@/locales/translate';
import React, { useEffect, useState } from 'react';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import SetupTOTPDialog from '@/components/dashboard/forms/SetupTOTPDialog';
import RecoveryTokensDialog from '@/components/dashboard/forms/RecoveryTokensDialog';
import DisableTOTPDialog from '@/components/dashboard/forms/DisableTOTPDialog';
import { useFlashKey } from '@/plugins/useFlash';

export default () => {
    const [tokens, setTokens] = useState<string[]>([]);
    const [visible, setVisible] = useState<'enable' | 'disable' | null>(null);
    const isEnabled = useStoreState((state: ApplicationStore) => state.user.data!.useTotp);
    const { clearAndAddHttpError } = useFlashKey('account:two-step');

    useEffect(() => {
        return () => clearAndAddHttpError();
    }, [visible]);

    const onTokens = (values: string[]) => {
        setTokens(values);
        setVisible(null);
    };

    return (
        <div>
            <SetupTOTPDialog open={visible === 'enable'} onClose={() => setVisible(null)} onTokens={onTokens} />
            <RecoveryTokensDialog tokens={tokens} open={tokens.length > 0} onClose={() => setTokens([])} />
            <DisableTOTPDialog open={visible === 'disable'} onClose={() => setVisible(null)} />
            <p css={tw`text-sm text-neutral-400`}>
                {isEnabled
                    ? vt("La double authentification protège actuellement votre compte.")
                    : vt("Ajoutez une seconde étape de vérification pour renforcer la sécurité de votre compte.")}
            </p>
            <div css={tw`mt-6`}>
                {isEnabled ? (
                    <Button.Danger onClick={() => setVisible('disable')}>{vt("Désactiver")}</Button.Danger>
                ) : (
                    <Button onClick={() => setVisible('enable')}>{vt("Activer la protection")}</Button>
                )}
            </div>
        </div>
    );
};
