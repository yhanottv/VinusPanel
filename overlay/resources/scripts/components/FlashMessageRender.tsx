import React from 'react';
import MessageBox from '@/components/MessageBox';
import { useStoreState } from 'easy-peasy';
import useFlash from '@/plugins/useFlash';
import styles from './message-box.module.css';

type Props = Readonly<{
  byKey?: string;
  className?: string;
}>;

const FlashMessageRender = ({ byKey, className }: Props) => {
  const { dismissFlash } = useFlash();
  const flashes = useStoreState((state) => state.flashes.items.map((flash, index) => ({ flash, index })).filter(({ flash }) => (byKey ? flash.key === byKey : true)));

  return flashes.length ? (
    <div className={`${styles.stack} ${className || ''}`}>
      {flashes.map(({ flash, index }) => (
        <React.Fragment key={flash.id || flash.type + flash.message}>
          <MessageBox type={flash.type} title={flash.title} onDismiss={() => dismissFlash(index)}>
            {flash.message}
          </MessageBox>
        </React.Fragment>
      ))}
    </div>
  ) : null;
};

export default FlashMessageRender;
