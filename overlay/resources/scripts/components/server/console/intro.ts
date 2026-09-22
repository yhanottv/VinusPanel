import { vt } from '@/locales/translate';
import { consoleBanner } from './banner';

interface IntroTerminal {
    cols: number;
    rows: number;
    element?: HTMLElement;
    writeln(data: string): void;
}

const PRELUDE = '\u001b[1m\u001b[33mcontainer@pterodactyl~ \u001b[0m';
const labels: Record<string, string> = {
    starting: vt("Démarrage du serveur"), running: vt("Serveur en ligne"),
    stopping: vt("Arrêt du serveur"), offline: vt("Serveur arrêté"),
};

// These are ordinary scrollback lines, just like Wings status messages.
// There is no alternate screen, timeout, output buffer or automatic erasure.
export function createConsoleIntro(terminal: IntroTerminal) {
    let lastState: string | null = null;
    let disposed = false;
    return {
        status(state: string | null) {
            if (disposed || !state || !labels[state] || state === lastState) return;
            const showBanner = lastState === null || state === 'starting';
            lastState = state;
            terminal.writeln(PRELUDE + labels[state] + '\u001b[0m');
            if (showBanner) {
                const screen = terminal.element?.querySelector('.xterm-screen')?.getBoundingClientRect();
                const cellAspect = screen?.width && screen?.height
                    ? (screen.height * terminal.cols) / (screen.width * terminal.rows) : 2;
                terminal.writeln('\u001b[38;2;255;122;26m' + consoleBanner(terminal.cols, terminal.rows, cellAspect) + '\u001b[0m');
            }
        },
        writeln(line: string) {
            if (!disposed) terminal.writeln(line);
        },
        dispose() { disposed = true; },
    };
}
