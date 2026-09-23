export const minecraftColors: Record<string, string> = {
    '0': '#000000', '1': '#0000aa', '2': '#00aa00', '3': '#00aaaa',
    '4': '#aa0000', '5': '#aa00aa', '6': '#ffaa00', '7': '#aaaaaa',
    '8': '#555555', '9': '#5555ff', a: '#55ff55', b: '#55ffff',
    c: '#ff5555', d: '#ff55ff', e: '#ffff55', f: '#ffffff',
};
export interface MotdSegment { text: string; color?: string; bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; obfuscated?: boolean; }
export function parseMotd(value: string): MotdSegment[] {
    const segments: MotdSegment[] = [];
    let style: Omit<MotdSegment, 'text'> = {};
    let text = '';
    const flush = () => { if (text) segments.push({ ...style, text }); text = ''; };
    for (let i = 0; i < value.length; i++) {
        const code = value[i] === '§' ? value[i + 1]?.toLowerCase() : '';
        if (code && (minecraftColors[code] || 'klmnor'.includes(code))) {
            flush(); i++;
            if (minecraftColors[code]) style = { color: minecraftColors[code] };
            else if (code === 'r') style = {};
            else style = { ...style, ...({ k: { obfuscated: true }, l: { bold: true }, m: { strike: true }, n: { underline: true }, o: { italic: true } }[code]) };
        } else text += value[i];
    }
    flush();
    return segments;
}
export function formatMotdSelection(value: string, start: number, end: number, code: string) {
    if (!/^[0-9a-fklmnor]$/.test(code)) return { value, caret: end };
    const at = (index: number) => parseMotd(value.slice(0, index) + '\u200b').slice(-1)[0];
    const flags = (style: MotdSegment) => (style.obfuscated ? '§k' : '') + (style.bold ? '§l' : '') + (style.strike ? '§m' : '') + (style.underline ? '§n' : '') + (style.italic ? '§o' : '');
    // Minecraft color codes clear decorations. Reapply active decorations so choosing
    // a color in the editor does not silently remove bold/italic from the selection.
    const prefix = `§${code}` + (minecraftColors[code] ? flags(at(start)) : '');
    const previous = at(end);
    const previousColor = Object.keys(minecraftColors).find(key => minecraftColors[key] === previous.color);
    const suffix = end > start ? '§r' + (previousColor ? `§${previousColor}` : '') + flags(previous) : '';
    return { value: value.slice(0, start) + prefix + value.slice(start, end) + suffix + value.slice(end), caret: end + prefix.length + suffix.length };
}
