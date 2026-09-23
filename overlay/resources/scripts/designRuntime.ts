import { useEffect, useState } from 'react';
import { vinusDesign, VinusDesignSettings, designDefaults } from '@/vinusDesign';
import { optionDefaults } from '@/designOptions';
export const designPreview = typeof window !== 'undefined' && window.parent !== window && new URLSearchParams(window.location.search).get('vinus-preview') === '1';
const fonts: Record<string,string> = { system: 'system-ui, sans-serif', montserrat: "'Vinus Montserrat', system-ui, sans-serif", arial: 'Arial, sans-serif', georgia: 'Georgia, serif', mono: 'ui-monospace, monospace' };
export const monoFonts: Record<string,string> = { system: 'ui-monospace, SFMono-Regular, monospace', consolas: 'Consolas, monospace', courier: '"Courier New", monospace' };
export function normalizeDesign(value: Partial<VinusDesignSettings>): VinusDesignSettings {
    return { ...designDefaults, ...value, options: { ...optionDefaults, ...value.options }, servers: value.servers || {}, navigation: value.navigation || [], console_rules: value.console_rules || [], links: value.links || [], cards: value.cards || [], css_rules: value.css_rules || [] };
}
export function safeDesignUrl(value: string): boolean {
    return !value || (/^https:\/\/[^\s<>"'\\]+$/i.test(value) || /^\/(?!\/)[^\s<>"'\\]*$/.test(value));
}
export function validCssRule(selector: string, declarations: string): boolean {
    return selector.length <= 300 && declarations.length <= 2000 && !/[{}<>@\\]/.test(selector + declarations) && !/(?:url\s*\(|expression\s*\(|behavior\s*:|-moz-binding|javascript:)/i.test(declarations);
}
export function applyDesign(value: VinusDesignSettings) {
    const root = document.documentElement, o = value.options;
    const rgb = [1,3,5].map(i => parseInt(value.accent.slice(i,i+2),16)).join(',');
    const vars: Record<string,string> = { accent:value.accent, 'accent-rgb':rgb, bg:value.background, glass:value.surface, surface:value.surface, 'server-card':value.server_card, text:value.text, muted:o.muted, raised:o.raised, 'button-text':o.button_text, success:o.success, danger:o.danger, warning:o.warning, radius:`${o.radius}px`, 'body-font':fonts[o.body_font], 'heading-font':fonts[o.heading_font], 'mono-font':monoFonts[o.mono_font], 'font-size':`${o.font_size}px`, 'card-alpha':String(o.card_opacity/100), 'page-alpha':String(o.page_opacity/100), 'light-bg':o.light_background, 'light-surface':o.light_surface, 'light-text':o.light_text, 'light-muted':o.light_muted, 'icon-weight':String(o.icon_weight/10), 'motion-duration':`${o.motion_duration}ms`, 'login-width':`${o.login_width}px`, 'background-image':value.background_image ? `url("${value.background_image.replace(/["\\]/g,'')}")` : 'none' };
    Object.entries(vars).forEach(([key,v]) => root.style.setProperty(`--vinus-${key}`,v));
    Object.entries(o).forEach(([key,v]) => root.setAttribute(`data-vinus-${key.replace(/_/g,'-')}`,String(v)));
    let style = document.getElementById('vinus-custom-rules') as HTMLStyleElement | null;
    if (!style) { style = document.createElement('style'); style.id = 'vinus-custom-rules'; document.head.appendChild(style); }
    style.textContent = value.css_rules.filter(rule => rule.enabled && validCssRule(rule.selector,rule.declarations)).map(rule => `${rule.selector}{${rule.declarations}}`).join('\n');
    const icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]'); if (icon) icon.href=o.favicon || value.logo;
}
export function publishDesign(value: VinusDesignSettings) {
    Object.assign(vinusDesign, normalizeDesign(value)); applyDesign(vinusDesign);
    window.dispatchEvent(new Event('vinus:design-change'));
}
export function useDesign() {
    const [value,setValue] = useState(() => ({...vinusDesign}));
    useEffect(() => { const update=() => setValue({...vinusDesign}); window.addEventListener('vinus:design-change',update); return () => window.removeEventListener('vinus:design-change',update); }, []);
    return value;
}
// Only mounted in an authenticated administrator's frame. Origin AND parent window are checked.
export function useDesignPreview(admin: boolean) {
    useEffect(() => {
        if (!designPreview || !admin) return;
        let picking=false;
        const receive=(event: MessageEvent) => {
            if (event.origin === window.location.origin && event.source === window.parent && event.data?.type === 'vinus:studio-pick') { picking=true; document.body.style.cursor='crosshair'; return; }
            if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'vinus:studio-draft') return;
            if (!event.data.design || typeof event.data.design.brand_name !== 'string') return;
            publishDesign(normalizeDesign(event.data.design));
            window.dispatchEvent(new CustomEvent('vinus:preview-theme',{detail:!!event.data.light}));
        };
        // Preview is read-only: capture before React handlers, including keyboard submits.
        const block=(event: Event) => {
            if (picking && event.type === 'click') {
                const target=event.target as Element;
                const classes=Array.from(target.classList).filter(value=>/^[a-zA-Z0-9_-]+$/.test(value)).slice(0,2);
                const selector=target.id && /^[a-zA-Z][a-zA-Z0-9_-]*$/.test(target.id) ? '#'+target.id : '.app-shell '+target.tagName.toLowerCase()+(classes.length?'.'+classes.join('.'):'');
                window.parent.postMessage({type:'vinus:studio-picked',selector},window.location.origin);
                picking=false;document.body.style.cursor='';event.preventDefault();event.stopImmediatePropagation();return;
            }
            if (picking && event.type === 'keydown' && (event as KeyboardEvent).key==='Escape') { picking=false;document.body.style.cursor=''; }
            if (event.type === 'submit' || (event.target as Element)?.closest('a,button,input,select,textarea')) { event.preventDefault(); event.stopImmediatePropagation(); } };
        window.addEventListener('message',receive);
        ['click','submit','keydown'].forEach(type => document.addEventListener(type,block,true));
        window.parent.postMessage({type:'vinus:studio-ready'},window.location.origin);
        return () => { window.removeEventListener('message',receive); ['click','submit','keydown'].forEach(type => document.removeEventListener(type,block,true)); };
    },[admin]);
}
if (typeof document !== 'undefined') applyDesign(vinusDesign);
