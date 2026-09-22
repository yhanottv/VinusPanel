import React from 'react';
import { changeLanguage, panelLanguage } from '@/locales/preferences';

export default function LanguageSelector() {
    return (
        <label className={'vinus-language'}>
            <span aria-hidden={'true'}>FR / EN</span>
            <select aria-label={'Langue / Language'} value={panelLanguage}
                onChange={(event) => changeLanguage(event.target.value)}>
                <option value={'fr'} lang={'fr'}>Français</option>
                <option value={'en'} lang={'en'}>English</option>
            </select>
        </label>
    );
}
