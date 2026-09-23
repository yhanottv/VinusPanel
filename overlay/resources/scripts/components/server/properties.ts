export function readProperties(source: string): Record<string, string> {
    const result: Record<string, string> = {};
    let continued = false;
    for (const line of source.split(/\r?\n/)) {
        if (!continued && /^\s*[#!]/.test(line)) continue;
        const skip = continued; continued = /(^|[^\\])(\\\\)*\\$/.test(line);
        if (skip || continued) continue;
        if (/^\s*[#!]/.test(line)) continue;
        const match = line.match(/^\s*([a-z0-9-]+)\s*[=:]\s*(.*)$/i);
        if (!match) continue;
        // Keep complex continued values in the original file editor.
        if (/(^|[^\\])(\\\\)*\\$/.test(match[2])) continue;
        result[match[1]] = match[2].replace(/\\u([\da-f]{4})|\\(.)/gi, (_, hex, char) => hex ? String.fromCharCode(parseInt(hex, 16)) : (({ n: '\n', r: '\r', t: '\t' } as Record<string, string>)[char] ?? char));
    }
    return result;
}
export function updateProperties(source: string, changes: Record<string, string>): string {
    const newline = source.includes('\r\n') ? '\r\n' : '\n';
    const encode = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t').replace(/[^\x20-\x7e]/g, c => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`).replace(/^ +/, spaces => '\\ '.repeat(spaces.length));
    const known = readProperties(source);
    let continued = false;
    return source.split(/\r?\n/).map(line => {
        if (!continued && /^\s*[#!]/.test(line)) return line;
        const skip = continued; continued = /(^|[^\\])(\\\\)*\\$/.test(line);
        if (skip || continued) return line;
        const match = line.match(/^(\s*)([a-z0-9-]+)(\s*[=:]\s*)(.*)$/i);
        if (!match || !Object.prototype.hasOwnProperty.call(changes, match[2]) || !Object.prototype.hasOwnProperty.call(known, match[2])) return line;
        return match[1] + match[2] + match[3] + encode(changes[match[2]]);
    }).join(newline);
}
