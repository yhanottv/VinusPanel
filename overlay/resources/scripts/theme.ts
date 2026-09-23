import { BreakpointFunction, createBreakpoint } from 'styled-components-breakpoint';
import { vinusDesign } from '@/vinusDesign';

type Breakpoints = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export const breakpoint: BreakpointFunction<Breakpoints> = createBreakpoint<Breakpoints>({
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
});

/**
 * VinusPanel brand tokens. Keep non-Tailwind consumers (Chart.js, inline
 * status colors, and image paths) in one place so future rebrands stay small.
 */
export const VINUS = {
    name: vinusDesign.brand_name,
    // Configure your community invitation here; an empty value hides the announcement.
    discordInvite: 'https://discord.gg/vinuspanel' as string,
    logo: vinusDesign.logo,
    colors: {
        accent: '#ff7a1a',
        accentDark: '#d84b00',
        accentSoft: '#ffb067',
        success: '#43d6a3',
        danger: '#fb7185',
        warning: '#fbbf24',
    },
} as const;
