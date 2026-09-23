import { logLevel, matchesLog, stripAnsi } from './logs';

describe('console log filtering', () => {
    it('classifies coloured warnings and fatal errors', () => {
        expect(logLevel('\x1b[33m[Server thread/WARN] Slow tick\x1b[0m')).toBe('warning');
        expect(logLevel('[FATAL] Crash')).toBe('error');
        expect(logLevel('java.lang.RuntimeException: example')).toBe('error');
        expect(logLevel('[INFO] Done')).toBe('all');
    });
    it('combines severity and text without matching ANSI sequences', () => {
        expect(matchesLog('\x1b[31m[ERROR] Missing mod\x1b[0m', 'error', 'MOD')).toBe(true);
        expect(matchesLog('[WARN] Missing mod', 'error', '')).toBe(false);
        expect(matchesLog('\x1b[31mHello', 'all', '31m')).toBe(false);
    });
    it('exports readable plain text', () => {
        expect(stripAnsi('\x1b[1m\x1b[32mReady\x1b[0m')).toBe('Ready');
    });
});
