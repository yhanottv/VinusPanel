import { parseMotd, formatMotdSelection } from './motd';
describe('Minecraft MOTD formatting', () => {
    it('resets formats on a color code, matching Minecraft', () => {
        expect(parseMotd('§lBold§aGreen§oItalic§rPlain')).toEqual([{ text: 'Bold', bold: true }, { text: 'Green', color: '#55ff55' }, { text: 'Italic', color: '#55ff55', italic: true }, { text: 'Plain' }]);
    });
    it('preserves line breaks and HTML as literal text', () => {
        expect(parseMotd('<img onerror=x>\n§zunknown')).toEqual([{ text: '<img onerror=x>\n§zunknown' }]);
    });
    it('formats the selected range and resets before surrounding text', () => {
        expect(formatMotdSelection('Hello world', 6, 11, 'b')).toEqual({ value: 'Hello §bworld§r', caret: 15 });
    });
    it('inserts an ongoing format at the caret', () => {
        expect(formatMotdSelection('Hello', 0, 0, 'l')).toEqual({ value: '§lHello', caret: 2 });
    });
    it('rejects arbitrary toolbar codes', () => {
        expect(formatMotdSelection('Hello', 0, 5, 'bad')).toEqual({ value: 'Hello', caret: 5 });
    });
    it('keeps bold when coloring selected text and restores surrounding formatting', () => {
        const edited = formatMotdSelection('§lHello world', 2, 7, '6');
        expect(parseMotd(edited.value)).toEqual([{ text: 'Hello', color: '#ffaa00', bold: true }, { text: ' world', bold: true }]);
    });
    it('keeps the color of adjacent text when styling only a word', () => {
        const edited = formatMotdSelection('§aHello world', 2, 7, 'l');
        expect(parseMotd(edited.value)).toEqual([{ text: 'Hello', color: '#55ff55', bold: true }, { text: ' world', color: '#55ff55' }]);
    });
});
