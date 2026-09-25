export interface PlayerItem { slot: number; id: string; count: number; name: string | null; enchanted: boolean; damage: number; }
export interface PlayerIdentity { uuid: string; name: string; online: boolean | null; operator: boolean; whitelisted: boolean; banned: boolean; }
export interface PlayerDetail extends PlayerIdentity {
    source: 'live' | 'snapshot' | 'save' | 'unavailable'; updated_at: number | null; health: number | null; max_health: number | null;
    food: number | null; armor: number | null; level: number | null; xp_progress: number | null; xp_total: number | null;
    game_mode: string | null; dimension: string | null; inventory: PlayerItem[]; ender_chest: PlayerItem[];
}
export type PlayerAction = 'heal' | 'kill' | 'feed' | 'operator' | 'whitelist' | 'ban' | 'gamemode' | 'experience';
export interface PlayerResponse { players: PlayerIdentity[]; selected: PlayerDetail | null; bridge: boolean; actions: PlayerAction[]; can_control: boolean; refreshed_at: number; }
export function requestId(): string { return Array.from(crypto.getRandomValues(new Uint8Array(16)),value=>value.toString(16).padStart(2,'0')).join(''); }
export function isPlayerUuid(value: string): boolean { return /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(value); }
