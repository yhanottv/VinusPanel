import React, { useEffect, useRef, useState } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { Line } from 'react-chartjs-2';
import { useChart, useChartTickLabel } from '@/components/server/console/chart';
import { hexToRgba } from '@/lib/helpers';
import { bytesToString } from '@/lib/formatters';
import { CloudDownloadIcon, CloudUploadIcon } from '@heroicons/react/solid';
import ChartBlock from '@/components/server/console/ChartBlock';
import Tooltip from '@/components/elements/tooltip/Tooltip';
import { faBolt, faExchangeAlt, faLayerGroup } from '@fortawesome/free-solid-svg-icons';

export default () => {
    const status = ServerContext.useStoreState((state) => state.status.value);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const previous = useRef<Record<'tx' | 'rx', number>>({ tx: -1, rx: -1 });
    const [current, setCurrent] = useState({ cpu: 0, memory: 0, inbound: 0, outbound: 0 });

    const cpu = useChartTickLabel('Processeur', limits.cpu, '%', 2);
    const memory = useChartTickLabel('Mémoire', limits.memory, 'Mio');
    const network = useChart('Réseau', {
        sets: 2,
        options: {
            scales: {
                y: {
                    ticks: {
                        callback(value) {
                            return bytesToString(typeof value === 'string' ? parseInt(value, 10) : value);
                        },
                    },
                },
            },
        },
        callback(opts, index) {
            return {
                ...opts,
                label: !index ? 'Trafic entrant' : 'Trafic sortant',
                borderColor: !index ? '#43d6a3' : '#ff7a1a',
                backgroundColor: hexToRgba(!index ? '#43d6a3' : '#ff7a1a', 0.12),
            };
        },
    });

    useEffect(() => {
        if (status === 'offline') {
            cpu.clear();
            memory.clear();
            network.clear();
            setCurrent({ cpu: 0, memory: 0, inbound: 0, outbound: 0 });
        }
    }, [status]);

    useWebsocketEvent(SocketEvent.STATS, (data: string) => {
        let values: any = {};
        try {
            values = JSON.parse(data);
        } catch (e) {
            return;
        }
        const memoryMiB = Math.floor(values.memory_bytes / 1024 / 1024);
        const inbound = previous.current.rx < 0 ? 0 : Math.max(0, values.network.rx_bytes - previous.current.rx);
        const outbound = previous.current.tx < 0 ? 0 : Math.max(0, values.network.tx_bytes - previous.current.tx);

        cpu.push(values.cpu_absolute);
        memory.push(memoryMiB);
        network.push([inbound, outbound]);
        setCurrent({ cpu: values.cpu_absolute, memory: memoryMiB, inbound, outbound });

        previous.current = { tx: values.network.tx_bytes, rx: values.network.rx_bytes };
    });

    return (
        <>
            <ChartBlock
                title={'Processeur'}
                value={`${current.cpu.toFixed(1)} %`}
                meta={'Utilisation instantanée'}
                icon={faBolt}
            >
                <Line {...cpu.props} />
            </ChartBlock>
            <ChartBlock
                title={'Mémoire'}
                value={bytesToString(current.memory * 1024 * 1024)}
                meta={'Mémoire active'}
                icon={faLayerGroup}
            >
                <Line {...memory.props} />
            </ChartBlock>
            <ChartBlock
                title={'Réseau'}
                value={`${bytesToString(current.inbound)}/s`}
                meta={`Sortant ${bytesToString(current.outbound)}/s`}
                icon={faExchangeAlt}
                legend={
                    <>
                        <Tooltip arrow content={'Entrant'}>
                            <CloudDownloadIcon className={'mr-2 h-4 w-4 text-green-400'} />
                        </Tooltip>
                        <Tooltip arrow content={'Sortant'}>
                            <CloudUploadIcon className={'h-4 w-4 text-primary-300'} />
                        </Tooltip>
                    </>
                }
            >
                <Line {...network.props} />
            </ChartBlock>
        </>
    );
};
