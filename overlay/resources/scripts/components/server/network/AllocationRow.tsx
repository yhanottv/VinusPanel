import { vt } from '@/locales/translate';
import React, { memo, useCallback, useState } from 'react';
import isEqual from 'react-fast-compare';
import tw from 'twin.macro';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNetworkWired } from '@fortawesome/free-solid-svg-icons';
import InputSpinner from '@/components/elements/InputSpinner';
import { Textarea } from '@/components/elements/Input';
import Can from '@/components/elements/Can';
import { Button } from '@/components/elements/button/index';
import GreyRowBox from '@/components/elements/GreyRowBox';
import { Allocation } from '@/api/server/getServer';
import styled from 'styled-components/macro';
import { debounce } from 'debounce';
import setServerAllocationNotes from '@/api/server/network/setServerAllocationNotes';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import CopyOnClick from '@/components/elements/CopyOnClick';
import DeleteAllocationButton from '@/components/server/network/DeleteAllocationButton';
import setPrimaryServerAllocation from '@/api/server/network/setPrimaryServerAllocation';
import getServerAllocations from '@/api/swr/getServerAllocations';
import { ip } from '@/lib/formatters';
import Code from '@/components/elements/Code';

const Label = styled.label`
    ${tw`mt-1 block select-none px-1 text-xs text-neutral-400 transition-colors duration-150`}
`;

const AllocationCard = styled(GreyRowBox)`
    ${tw`mt-3 grid items-center gap-4 rounded-2xl border-neutral-600 bg-neutral-800 p-4`};
    grid-template-columns: 3rem minmax(8rem, 0.8fr) 5rem minmax(12rem, 1.4fr) auto;
    background: var(--vinus-surface);

    @media (max-width: 767px) {
        ${tw`gap-3`};
        grid-template-columns: 3rem minmax(0, 1fr) 5rem;
    }
`;

const NetworkIcon = styled.div`
    ${tw`flex h-11 w-11 items-center justify-center rounded-xl text-primary-300`};
    background: rgba(255, 122, 26, 0.1);
    border: 1px solid rgba(255, 122, 26, 0.18);
`;

interface Props {
    allocation: Allocation;
}

const AllocationRow = ({ allocation }: Props) => {
    const [loading, setLoading] = useState(false);
    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:network');
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);
    const { mutate } = getServerAllocations();

    const onNotesChanged = useCallback((id: number, notes: string) => {
        mutate((data) => data?.map((a) => (a.id === id ? { ...a, notes } : a)), false);
    }, []);

    const setAllocationNotes = debounce((notes: string) => {
        setLoading(true);
        clearFlashes();

        setServerAllocationNotes(uuid, allocation.id, notes)
            .then(() => onNotesChanged(allocation.id, notes))
            .catch((error) => clearAndAddHttpError(error))
            .then(() => setLoading(false));
    }, 750);

    const setPrimaryAllocation = () => {
        clearFlashes();
        mutate((data) => data?.map((a) => ({ ...a, isDefault: a.id === allocation.id })), false);

        setPrimaryServerAllocation(uuid, allocation.id).catch((error) => {
            clearAndAddHttpError(error);
            mutate();
        });
    };

    return (
        <AllocationCard $hoverable={false}>
            <NetworkIcon>
                <FontAwesomeIcon icon={faNetworkWired} />
            </NetworkIcon>
            <div className={'min-w-0'}>
                {allocation.alias ? (
                    <CopyOnClick text={allocation.alias}>
                        <Code dark className={'block truncate'}>
                            {allocation.alias}
                        </Code>
                    </CopyOnClick>
                ) : (
                    <CopyOnClick text={ip(allocation.ip)}>
                        <Code dark>{ip(allocation.ip)}</Code>
                    </CopyOnClick>
                )}
                <Label>{allocation.alias ? vt("Nom d’hôte") : vt("Adresse IP")}</Label>
            </div>
            <div className={'overflow-hidden'}>
                <Code dark>{allocation.port}</Code>
                <Label>Port</Label>
            </div>
            <div className={'col-span-3 w-full md:col-span-1'}>
                <InputSpinner visible={loading}>
                    <Textarea
                        className={
                            'min-h-[3.2rem] resize-none border-neutral-600 bg-neutral-900 hover:border-neutral-500'
                        }
                        placeholder={vt("Ajouter une note…")}
                        defaultValue={allocation.notes || undefined}
                        onChange={(e) => setAllocationNotes(e.currentTarget.value)}
                    />
                </InputSpinner>
            </div>
            <div className={'col-span-3 flex w-full justify-end space-x-3 md:col-span-1 md:w-auto'}>
                {allocation.isDefault ? (
                    <Button size={Button.Sizes.Small} className={'!text-gray-50 !bg-primary-600'} disabled>{vt("Principale")}</Button>
                ) : (
                    <>
                        <Can action={'allocation.delete'}>
                            <DeleteAllocationButton allocation={allocation.id} />
                        </Can>
                        <Can action={'allocation.update'}>
                            <Button.Text size={Button.Sizes.Small} onClick={setPrimaryAllocation}>{vt("Définir par défaut")}</Button.Text>
                        </Can>
                    </>
                )}
            </div>
        </AllocationCard>
    );
};

export default memo(AllocationRow, isEqual);
