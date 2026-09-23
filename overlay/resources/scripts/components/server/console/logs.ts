export type LogLevel = 'all' | 'warning' | 'error';
export const stripAnsi = (text: string) => text.replace(/\x1b\[[0-?]*[ -/]*[@-~]/g, '');
export function logLevel(line: string): LogLevel {
    const text = stripAnsi(line);
    if (/\b(ERROR|FATAL|SEVERE|[a-zA-Z.]*Exception)\b/i.test(text)) return 'error';
    if (/\b(WARN|WARNING)\b/i.test(text)) return 'warning';
    return 'all';
}
export function matchesLog(line: string, level: LogLevel, search: string) {
    return (level === 'all' || logLevel(line) === level) && stripAnsi(line).toLowerCase().includes(search.toLowerCase());
}
