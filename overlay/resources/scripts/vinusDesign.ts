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
    accent: '#ff9b52',
    background: '#0b0d12',
    surface: '#101319',
    server_card: '#101319',
    text: '#e2e8f0',
    logo: '/assets/images/vinus/eagle.png',
    background_image: '',
    servers: {},
};

const fromPage = (window as Window & { VinusDesign?: Partial<VinusDesignSettings> }).VinusDesign;
export const vinusDesign: VinusDesignSettings = { ...defaults, ...fromPage, servers: fromPage?.servers || {} };

export const serverDesign = (uuid: string): ServerDesign => vinusDesign.servers[uuid] || {};
