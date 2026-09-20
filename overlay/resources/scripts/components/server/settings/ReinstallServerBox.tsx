import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import reinstallServer from '@/api/server/reinstallServer';
import { Actions, useStoreActions } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import { httpErrorToHuman } from '@/api/http';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { Dialog } from '@/components/elements/dialog';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const skipScripts = ServerContext.useStoreState((state) => state.server.data!.skipScripts);
    const [modalVisible, setModalVisible] = useState(false);
    const { addFlash, clearFlashes } = useStoreActions((actions: Actions<ApplicationStore>) => actions.flashes);

    const reinstall = () => {
        clearFlashes('settings');
        reinstallServer(uuid)
            .then(() => {
                addFlash({
                    key: 'settings',
                    type: 'success',
                    message: 'La réinstallation du serveur a commencé.',
                });
            })
            .catch((error) => {
                console.error(error);

                addFlash({ key: 'settings', type: 'error', message: httpErrorToHuman(error) });
            })
            .then(() => setModalVisible(false));
    };

    useEffect(() => {
        clearFlashes();
    }, []);

    if (skipScripts) {
        return (
            <TitledGreyBox title={'Réinstaller le serveur'}>
                <p css={tw`text-sm`}>
                    La réinstallation est désactivée car ce serveur ignore le script d&apos;installation de son egg.
                    Contactez un administrateur pour effectuer cette opération.
                </p>
            </TitledGreyBox>
        );
    }

    return (
        <TitledGreyBox title={'Réinstaller le serveur'} css={tw`relative`}>
            <Dialog.Confirm
                open={modalVisible}
                title={'Confirmer la réinstallation'}
                confirm={'Réinstaller le serveur'}
                onClose={() => setModalVisible(false)}
                onConfirmed={reinstall}
            >
                Le serveur sera arrêté et certains fichiers pourront être supprimés ou modifiés. Voulez-vous continuer ?
            </Dialog.Confirm>
            <p css={tw`text-sm`}>
                Cette opération arrête le serveur puis relance son script d&apos;installation.&nbsp;
                <strong css={tw`font-medium`}>
                    Sauvegardez vos données avant de continuer : certains fichiers peuvent être supprimés ou modifiés.
                </strong>
            </p>
            <div css={tw`mt-6 text-right`}>
                <Button.Danger variant={Button.Variants.Secondary} onClick={() => setModalVisible(true)}>
                    Réinstaller le serveur
                </Button.Danger>
            </div>
        </TitledGreyBox>
    );
};
