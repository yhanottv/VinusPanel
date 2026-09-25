/** @jest-environment jsdom */
import React from 'react';
import { createStore, StoreProvider } from 'easy-peasy';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import flashes from '@/state/flashes';
import FlashMessageRender from './FlashMessageRender';
import MessageBox from './MessageBox';

jest.mock('@/api/http', () => ({ httpErrorToHuman: () => 'Request failed' }));
jest.mock('@/locales/translate', () => ({ vt: (text: string) => text }));
jest.mock('./message-box.module.css', () => ({}));
afterEach(cleanup);

it('dismisses only the selected notification, even with a filtered key', () => {
    const store = createStore({ flashes });
    store.getActions().flashes.addFlash({ key: 'other', type: 'info', message: 'Keep this' });
    store.getActions().flashes.addFlash({ key: 'files', type: 'error', message: 'Check file permissions' });
    store.getActions().flashes.addFlash({ key: 'files', type: 'success', message: 'Saved' });
    render(<StoreProvider store={store}><FlashMessageRender byKey="files"/></StoreProvider>);
    expect(screen.getByRole('alert').textContent).toContain('Check file permissions');
    expect(screen.queryByText('Keep this')).toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Fermer la notification' })[0]);
    expect(store.getState().flashes.items.map(item => item.message)).toEqual(['Keep this', 'Saved']);
    expect(screen.getByRole('status').textContent).toContain('Saved');
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(store.getState().flashes.items).toHaveLength(1);
});

it('renders error content as text and preserves caller recovery actions', () => {
    const retry = jest.fn();
    render(<MessageBox type="error" title="Error">{'<script>secret()</script>'}<button onClick={retry}>Réessayer</button></MessageBox>);
    expect(screen.getByRole('alert').querySelector('script')).toBeNull();
    expect(screen.getByText('Erreur')).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Fermer la notification' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
    expect(retry).toHaveBeenCalledTimes(1);
});

it('dismisses a local presentation without clearing the underlying error and shows a new error', () => {
    const { rerender } = render(<MessageBox key="first" type="error" dismissible>First error</MessageBox>);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer la notification' }));
    expect(screen.queryByRole('alert')).toBeNull();
    rerender(<MessageBox key="second" type="error" dismissible>Second error</MessageBox>);
    expect(screen.getByRole('alert').textContent).toBe('Second error');
});
