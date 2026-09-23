import { DesignOptions, optionDefaults } from './designOptions';
export interface ServerDesign {
    color?: string;
    banner?: string;
}

export interface DesignLink { label: string; url: string; description: string; featured: boolean; visible: boolean }
export interface NavigationRule { path: string; label: string; visible: boolean; order: number }
export interface ConsoleRule { search: string; replacement: string }
export interface CssRule { selector: string; declarations: string; enabled: boolean }
export interface VinusDesignSettings {
    options: DesignOptions;
    navigation: NavigationRule[];
    console_rules: ConsoleRule[];
    links: DesignLink[];
    cards: DesignLink[];
    css_rules: CssRule[];
    brand_name: string;
    accent: string;
    background: string;
    surface: string;
    server_card: string;
    text: string;
    logo: string;
    background_image: string;
    servers: Record<string, ServerDesign>;
}

export const designDefaults: VinusDesignSettings = {
    options: optionDefaults, navigation: [], console_rules: [], links: [], cards: [], css_rules: [],
    brand_name: 'VinusPanel',
    accent: '#ff9b52',
    background: '#0b0d12',
    surface: '#101319',
    server_card: '#101319',
    text: '#e2e8f0',
    logo: '/assets/images/vinus/eagle.png',
    background_image: '',
    servers: {},
};

const fromPage = typeof window === 'undefined' ? undefined : (window as Window & { VinusDesign?: Partial<VinusDesignSettings> }).VinusDesign;
export const vinusDesign: VinusDesignSettings = { ...designDefaults, ...fromPage, options: { ...optionDefaults, ...fromPage?.options }, navigation: fromPage?.navigation || [], console_rules: fromPage?.console_rules || [], links: fromPage?.links || [], cards: fromPage?.cards || [], css_rules: fromPage?.css_rules || [], servers: fromPage?.servers || {} };

export const serverDesign = (uuid: string): ServerDesign => vinusDesign.servers[uuid] || {};
