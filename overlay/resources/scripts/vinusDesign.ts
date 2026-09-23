export interface ServerDesign {
    color?: string;
    banner?: string;
}

export interface VinusDesignSettings {
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

const defaults: VinusDesignSettings = {
    brand_name: 'VinusPanel',
    accent: '#ff7a1a',
    background: '#08080a',
    surface: '#101012',
    server_card: '#101012',
    text: '#e5e5e9',
    logo: '/assets/images/vinus/eagle.png',
    background_image: '',
    servers: {},
};

const fromPage = (window as Window & { VinusDesign?: Partial<VinusDesignSettings> }).VinusDesign;
export const vinusDesign: VinusDesignSettings = { ...defaults, ...fromPage, servers: fromPage?.servers || {} };

export const serverDesign = (uuid: string): ServerDesign => vinusDesign.servers[uuid] || {};
