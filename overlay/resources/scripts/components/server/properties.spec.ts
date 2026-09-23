import { readProperties, updateProperties } from './properties';

describe('Minecraft properties', () => {
    it('decodes colours, newlines and escaped separators', () => {
        expect(readProperties('motd=\\u00a7bHello\\nWorld\\: test\npvp=true')).toEqual({ motd: '§bHello\nWorld: test', pvp: 'true' });
    });
    it('preserves comments, CRLF, unknown settings and trailing newline', () => {
        const original = '# Settings\r\nmotd=Old\r\nrcon.password=unchanged\r\npvp=true\r\n';
        expect(updateProperties(original, { motd: '§aNew\nLine' })).toBe('# Settings\r\nmotd=\\u00a7aNew\\nLine\r\nrcon.password=unchanged\r\npvp=true\r\n');
    });
    it('does not insert undeclared properties or modify continued values', () => {
        const original = 'motd=hello\\\n  world\npvp=true';
        expect(readProperties(original)).toEqual({ pvp: 'true' });
        expect(updateProperties(original, { motd: 'changed', unknown: 'new' })).toBe(original);
    });
    it('updates duplicate supported keys consistently', () => {
        expect(updateProperties('pvp=true\npvp=false', { pvp: 'true' })).toBe('pvp=true\npvp=true');
    });
    it('does not interpret continued lines as separate settings', () => {
        const source = 'motd=first\\\n pvp=false\npvp=true';
        expect(readProperties(source)).toEqual({ pvp: 'true' });
        expect(updateProperties(source, { pvp: 'false' })).toBe('motd=first\\\n pvp=false\npvp=false');
    });
    it('preserves leading spaces in the message', () => {
        expect(readProperties(updateProperties('motd=old', { motd: '  Hello' })).motd).toBe('  Hello');
    });
    it('round trips escaped Windows paths and non ASCII characters', () => {
        const value = 'C:\\worlds\\été';
        expect(readProperties(updateProperties('level-name=old', { 'level-name': value }))['level-name']).toBe(value);
    });
});
