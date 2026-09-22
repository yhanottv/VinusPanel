import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ServerContext } from '@/state/server';
import { SocketEvent } from '@/components/server/events';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { Line } from 'react-chartjs-2';
import { useChart, useChartTickLabel, formatChartValue, formatChartBytes } from '@/components/server/console/chart';
import { hexToRgba } from '@/lib/helpers';
import ChartBlock from '@/components/server/console/ChartBlock';
import { faBolt, faExchangeAlt, faLayerGroup } from '@fortawesome/free-solid-svg-icons';

export default () => {
  const status = ServerContext.useStoreState((state) => state.status.value);
  const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
  const previous = useRef<{ tx: number; rx: number; at: number } | null>(null);
  const connected = ServerContext.useStoreState((state) => state.socket.connected);
  const [current, setCurrent] = useState({ cpu: 0, memory: 0, inbound: 0, outbound: 0 });

  const cpu = useChartTickLabel('Processeur', limits.cpu, '%', 0);
  const memory = useChartTickLabel('Mémoire', limits.memory, 'Mio');
  const networkOptions = useMemo(
    () => ({
      scales: {
        y: {
          ticks: {
            callback(value: string | number) {
              return formatChartBytes(typeof value === 'string' ? parseInt(value, 10) : value);
            },
          },
        },
      },
    }),
    []
  );
  const network = useChart('Réseau', {
    sets: 2,
    options: networkOptions,
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
    previous.current = null;
  }, [connected]);

  useEffect(() => {
    if (status === 'offline') {
      previous.current = null;
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
    if (
      ![values.cpu_absolute, values.memory_bytes, values.network?.rx_bytes, values.network?.tx_bytes].every(
        (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0
      )
    )
      return;
    const memoryMiB = values.memory_bytes / 1024 / 1024;
    const at = performance.now();
    const seconds = previous.current ? (at - previous.current.at) / 1000 : 0;
    const inbound =
      previous.current && seconds > 0 ? Math.max(0, values.network.rx_bytes - previous.current.rx) / seconds : 0;
    const outbound =
      previous.current && seconds > 0 ? Math.max(0, values.network.tx_bytes - previous.current.tx) / seconds : 0;

    cpu.push(values.cpu_absolute);
    memory.push(memoryMiB);
    network.push([inbound, outbound]);
    setCurrent({ cpu: values.cpu_absolute, memory: memoryMiB, inbound, outbound });

    previous.current = { tx: values.network.tx_bytes, rx: values.network.rx_bytes, at };
  });

  return (
    <>
      <ChartBlock
        title={'Processeur'}
        value={formatChartValue(current.cpu, '%')}
        meta={limits.cpu > 0 ? `Limite : ${formatChartValue(limits.cpu, '%', 0)}` : 'Sans limite CPU'}
        icon={faBolt}
      >
        <Line {...cpu.props} role={'img'} aria-label={'Historique du processeur en pourcentage'} />
      </ChartBlock>
      <ChartBlock
        title={'Mémoire'}
        value={formatChartBytes(current.memory * 1024 * 1024)}
        meta={limits.memory > 0 ? `sur ${formatChartBytes(limits.memory * 1024 * 1024)}` : 'Sans limite mémoire'}
        icon={faLayerGroup}
      >
        <Line {...memory.props} role={'img'} aria-label={'Historique de la mémoire utilisée'} />
      </ChartBlock>
      <ChartBlock
        title={'Réseau'}
        icon={faExchangeAlt}
        value={`${formatChartBytes(current.inbound)}/s`}
        meta={'Entrant'}
        secondaryValue={`${formatChartBytes(current.outbound)}/s`}
      >
        <Line {...network.props} role={'img'} aria-label={'Historique des débits entrant et sortant'} />
      </ChartBlock>
    </>
  );
};
