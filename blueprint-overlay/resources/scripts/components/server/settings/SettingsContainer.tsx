import PrivateValue from '@/components/elements/PrivateValue';
import { vt } from '@/locales/translate';
import BeforeContent from '@blueprint/components/Server/Settings/BeforeContent';
import AfterContent from '@blueprint/components/Server/Settings/AfterContent';
import React from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import RenameServerBox from '@/components/server/settings/RenameServerBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import Can from '@/components/elements/Can';
import ReinstallServerBox from '@/components/server/settings/ReinstallServerBox';
import tw from 'twin.macro';
import Input from '@/components/elements/Input';
import Label from '@/components/elements/Label';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import isEqual from 'react-fast-compare';
import CopyOnClick from '@/components/elements/CopyOnClick';
import { ip } from '@/lib/formatters';
import { Button } from '@/components/elements/button/index';

export default () => {
    const username = useStoreState((state) => state.user.data!.username);
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const node = ServerContext.useStoreState((state) => state.server.data!.node);
    const sftp = ServerContext.useStoreState((state) => state.server.data!.sftpDetails, isEqual);

    return (
        <ServerContentBlock title={'Settings'}>
<BeforeContent />
            <FlashMessageRender byKey={'settings'} css={tw`mb-4`} />
            <div css={tw`grid grid-cols-1 gap-6 xl:grid-cols-2`}>
                <div css={tw`w-full`}>
                    <Can action={'file.sftp'}>
                        <TitledGreyBox title={vt("Connexion SFTP")} css={tw`mb-6`}>
                            <div>
                                <Label>{vt("Adresse du serveur")}</Label>
                                <CopyOnClick text={`sftp://${ip(sftp.ip)}:${sftp.port}`}>
                                    <PrivateValue block><Input aria-label={vt('Adresse du serveur')} type={'text'} value={`sftp://${ip(sftp.ip)}:${sftp.port}`} readOnly /></PrivateValue>
                                </CopyOnClick>
                            </div>
                            <div css={tw`mt-6`}>
                                <Label>{vt("Identifiant")}</Label>
                                <CopyOnClick text={`${username}.${id}`}>
                                    <PrivateValue block><Input aria-label={vt('Identifiant')} type={'text'} value={`${username}.${id}`} readOnly /></PrivateValue>
                                </CopyOnClick>
                            </div>
                            <div css={tw`mt-6 flex items-center`}>
                                <div css={tw`flex-1`}>
                                    <div css={tw`border-l-4 border-cyan-500 p-3`}>
                                        <p css={tw`text-xs text-neutral-200`}>{vt("Le mot de passe SFTP est identique à celui utilisé pour accéder à ce panel.")}</p>
                                    </div>
                                </div>
                                <div css={tw`ml-4`}>
                                    <a href={`sftp://${username}.${id}@${ip(sftp.ip)}:${sftp.port}`}>
                                        <Button.Text variant={Button.Variants.Secondary}>{vt("Ouvrir SFTP")}</Button.Text>
                                    </a>
                                </div>
                            </div>
                        </TitledGreyBox>
                    </Can>
                    <TitledGreyBox title={vt("Informations techniques")} css={tw`mb-6`}>
                        <div css={tw`flex items-center justify-between text-sm`}>
                            <p>{vt("Nœud")}</p>
                            <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{node}</code>
                        </div>
                        <CopyOnClick text={uuid}>
                            <div css={tw`flex items-center justify-between mt-2 text-sm`}>
                                <p>{vt("Identifiant serveur")}</p>
                                <code css={tw`font-mono bg-neutral-900 rounded py-1 px-2`}>{uuid}</code>
                            </div>
                        </CopyOnClick>
                    </TitledGreyBox>
                </div>
                <div css={tw`w-full`}>
                    <Can action={'settings.rename'}>
                        <div css={tw`mb-6`}>
                            <RenameServerBox />
                        </div>
                    </Can>
                    <Can action={'settings.reinstall'}>
                        <ReinstallServerBox />
                    </Can>
                </div>
            </div>
        <AfterContent />
</ServerContentBlock>
    );
};
