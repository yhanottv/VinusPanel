import { vt } from '@/locales/translate';
import React, { useEffect, useRef, useState } from 'react';
import { Websocket } from '@/plugins/Websocket';
import { ServerContext } from '@/state/server';
import getWebsocketToken from '@/api/server/getWebsocketToken';
import ContentContainer from '@/components/elements/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';
import { httpErrorToHuman } from '@/api/http';

const reconnectErrors = ['jwt: exp claim is invalid', 'jwt: created too far in past (denylist)'];

export default () => {
    const updatingToken = useRef(false);
    const [error, setError] = useState<'connecting' | string>('');
    const { connected, instance } = ServerContext.useStoreState((state) => state.socket);
    const uuid = ServerContext.useStoreState((state) => state.server.data?.uuid);
    const setServerStatus = ServerContext.useStoreActions((actions) => actions.status.setServerStatus);
    const { setInstance, setConnectionState } = ServerContext.useStoreActions((actions) => actions.socket);

    const updateToken = (uuid: string, socket: Websocket) => {
        if (updatingToken.current) return;

        updatingToken.current = true;
        getWebsocketToken(uuid)
            .then((data) => socket.setToken(data.token, true))
            .catch((error) => setError('Authentification auprès du panel : ' + httpErrorToHuman(error)))
            .then(() => {
                updatingToken.current = false;
            });
    };

    const connect = (uuid: string) => {
        const socket = new Websocket();

        socket.on('auth success', () => setConnectionState(true));
        socket.on('SOCKET_CLOSE', () => { setConnectionState(false); setError('connecting'); });
        socket.on('SOCKET_CONNECT_ERROR', () => {
            setError(vt("Connexion au serveur (Wings) impossible. Le panel reste accessible, mais les commandes et mesures en direct sont indisponibles. Réessayez ; si cela persiste, un administrateur doit vérifier Wings, le réseau et le certificat du nœud."));
        });
        socket.on('SOCKET_ERROR', () => {
            setError('connecting');
            setConnectionState(false);
        });
        socket.on('status', (status) => setServerStatus(status));

        socket.on('daemon error', (message) => {
            console.warn('Got error message from daemon socket:', message);
        });

        socket.on('token expiring', () => updateToken(uuid, socket));
        socket.on('token expired', () => updateToken(uuid, socket));
        socket.on('jwt error', (error: string) => {
            setConnectionState(false);
            console.warn('JWT validation error from wings:', error);

            if (reconnectErrors.find((v) => error.toLowerCase().indexOf(v) >= 0)) {
                updateToken(uuid, socket);
            } else {
                setError(
                    vt("Le serveur (Wings) a refusé la session de console. Reconnectez-vous au panel ; si cela persiste, un administrateur doit vérifier l’horloge et la configuration du nœud.")
                );
            }
        });

        socket.on('transfer status', (status: string) => {
            if (status === 'starting' || status === 'success') {
                return;
            }

            // This code forces a reconnection to the websocket which will connect us to the target node instead of the source node
            // in order to be able to receive transfer logs from the target node.
            socket.close();
            setError('connecting');
            setConnectionState(false);
            setInstance(null);
            connect(uuid);
        });

        getWebsocketToken(uuid)
            .then((data) => {
                // Connect and then set the authentication token.
                socket.setToken(data.token).connect(data.socket);

                // Once that is done, set the instance.
                setInstance(socket);
            })
            .catch((error) => setError('Authentification auprès du panel : ' + httpErrorToHuman(error)));
    };

    useEffect(() => {
        connected && setError('');
    }, [connected]);

    useEffect(() => {
        return () => {
            instance && instance.close();
        };
    }, [instance]);

    useEffect(() => {
        // If there is already an instance or there is no server, just exit out of this process
        // since we don't need to make a new connection.
        if (instance || !uuid) {
            return;
        }

        connect(uuid);
    }, [uuid, instance]);

    return error ? (
        <CSSTransition timeout={150} in appear classNames={'fade'}>
            <div css={tw`bg-red-500 py-2`}>
                <ContentContainer css={tw`flex flex-wrap items-center justify-between gap-3 px-4`} role={'alert'}>
                    {error === 'connecting' ? (
                        <>
                            <Spinner size={'small'} />
                            <p css={tw`ml-2 text-sm text-red-100`}>{vt("Liaison avec le serveur interrompue. Reconnexion automatique en cours ; les mesures et commandes sont temporairement indisponibles.")}</p>
                        </>
                    ) : (
                        <div><p css={tw`text-sm font-semibold text-white`}>{vt("Console — connexion interrompue")}</p><p css={tw`mt-1 text-sm text-white`}>{error}</p><button type={'button'} css={tw`mt-3 rounded border border-white px-3 py-1 text-sm text-white`} onClick={() => window.location.reload()}>{vt("Reconnecter la console")}</button></div>
                    )}
                </ContentContainer>
            </div>
        </CSSTransition>
    ) : null;
};
