/** @jest-environment jsdom */
import { Terminal } from 'xterm';
import { createConsoleIntro } from './intro';
import { consoleBanner } from './banner';

const setup = (cols = 140) => {
    const terminal = { cols, rows: 24, writeln: jest.fn() };
    return { terminal, intro: createConsoleIntro(terminal) };
};

it('writes the supplied orange drawing immediately after the stopped status', () => {
    const { terminal, intro } = setup();
    intro.status('offline');
    expect(terminal.writeln.mock.calls[0][0]).toContain('container@pterodactyl~ \u001b[0mServeur arrêté');
    expect(terminal.writeln.mock.calls[1][0]).toBe('\u001b[38;2;255;122;26m' + consoleBanner(140) + '\u001b[0m');
});

it('never expires or buffers incoming logs', () => {
    jest.useFakeTimers();
    try {
        const { terminal, intro } = setup();
        intro.status('offline');
        intro.writeln('first log'); intro.writeln('second log');
        expect(terminal.writeln.mock.calls.slice(2)).toEqual([['first log'], ['second log']]);
        jest.advanceTimersByTime(60000);
        expect(terminal.writeln).toHaveBeenCalledTimes(4);
        expect(jest.getTimerCount()).toBe(0);
    } finally { jest.useRealTimers(); }
});

it('deduplicates store/socket status and prints once for each real startup', () => {
    const { terminal, intro } = setup();
    intro.status('starting'); intro.status('starting');
    expect(terminal.writeln).toHaveBeenCalledTimes(2);
    intro.status('running'); intro.status('running');
    expect(terminal.writeln).toHaveBeenCalledTimes(3);
    intro.status('stopping'); intro.status('offline'); intro.status('starting');
    expect(terminal.writeln).toHaveBeenCalledTimes(7);
    expect(terminal.writeln.mock.calls.filter(([line]) => line.includes('\u001b[38;2;255;122;26m'))).toHaveLength(2);
});

it('waits for a known status and cannot write after disposal', () => {
    const { terminal, intro } = setup();
    intro.status(null); intro.status('unknown');
    expect(terminal.writeln).not.toHaveBeenCalled();
    intro.status('offline'); intro.dispose(); intro.status('starting'); intro.writeln('late');
    expect(terminal.writeln).toHaveBeenCalledTimes(2);
});

it.each([25, 35, 42, 68, 69, 80, 136, 137, 160])('fits the artwork within %i columns', (cols) => {
    expect(consoleBanner(cols).split('\r\n').every((row) => row.length <= cols)).toBe(true);
});

it('centers the eagle as a single drawing and fits its height inside the terminal', () => {
    const lines = consoleBanner(80, 24).split('\r\n');
    expect(lines.length).toBeLessThanOrEqual(23);
    expect(lines.join('').replace(/[ \u2800-\u28ff]/g, '')).toBe('');
    const occupied = lines.filter((line) => line.trim().length > 0);
    const left = Math.min(...occupied.map((line) => line.search(/[^ ]/)));
    const right = 80 - Math.max(...occupied.map((line) => line.trimEnd().length));
    expect(Math.abs(left - right)).toBeLessThanOrEqual(2);
});

it('preserves the drawing and later logs in real xterm scrollback', async () => {
    const terminal = new Terminal({ cols: 140, rows: 24, scrollback: 1000 });
    const flush = () => new Promise<void>((resolve) => terminal.write('', resolve));
    const intro = createConsoleIntro(terminal);
    intro.status('offline');
    for (let i = 0; i < 40; i++) intro.writeln('log ' + i);
    await flush();
    expect(terminal.buffer.active.type).toBe('normal');
    expect(terminal.buffer.active.getLine(0)?.translateToString(true)).toContain('Serveur arrêté');
    const drawing = consoleBanner(140, 24).split('\r\n');
    drawing.forEach((line, index) => expect(terminal.buffer.active.getLine(index + 1)?.translateToString(true).trimEnd()).toBe(line.trimEnd()));
    expect(terminal.buffer.active.getLine(drawing.length + 40)?.translateToString(true)).toBe('log 39');
    intro.dispose(); terminal.dispose();
});
