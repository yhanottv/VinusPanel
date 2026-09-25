/** @jest-environment jsdom */
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import LanguageSelector from './LanguageSelector';
import { changeLanguage } from '@/locales/preferences';
jest.mock('@/locales/preferences', () => ({ panelLanguage: 'fr', changeLanguage: jest.fn() }));
jest.mock('@/locales/translate', () => ({ vt: (value: string) => value }));
jest.mock('./language-selector.module.css', () => ({}));
afterEach(() => { cleanup(); jest.clearAllMocks(); });

it('offers all eight flags and supports arrow keys, selection and escape', () => {
    render(<LanguageSelector compact />);
    const trigger=screen.getByRole('button', {name:'Langue · Français'});
    fireEvent.click(trigger);
    const options=screen.getAllByRole('menuitemradio');
    expect(options).toHaveLength(8);
    expect(options.every(option=>option.querySelector('svg'))).toBe(true);
    expect(document.activeElement).toBe(options[0]);
    fireEvent.keyDown(options[0], {key:'ArrowDown'});
    expect(document.activeElement).toBe(options[1]);
    fireEvent.keyDown(options[1], {key:'Escape'});
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitemradio', {name:/Türkçe/}));
    expect(changeLanguage).toHaveBeenCalledWith('tr');
    expect(screen.queryByRole('menu')).toBeNull();
});
