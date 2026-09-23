import { useDesign, monoFonts, designPreview } from '@/designRuntime';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faHistory, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { SearchAddon } from 'xterm-addon-search';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Unicode11Addon } from 'xterm-addon-unicode11';
import { ServerContext } from '@/state/server';
import { usePermissions } from '@/plugins/usePermissions';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import { vt } from '@/locales/translate';
import { LogLevel, logLevel, matchesLog, stripAnsi } from './logs';
import 'xterm/css/xterm.css';
import styles from './terminal.module.css';
import CommandRow from '@blueprint/components/Server/Terminal/CommandRow';

export default function Console() {
    const design = useDesign();
    const host = useRef<HTMLDivElement>(null);
    const command = useRef<HTMLInputElement>(null);
    const lines = useRef<string[]>([]);
    const frame = useRef<number | null>(null);
    const [revision, setRevision] = useState(0);
    const [filter, setFilter] = useState<LogLevel>('all');
    const [search, setSearch] = useState('');
    const [fontSize, setFontSize] = useState(design.options.console_font_size);
    const [showFilter, setShowFilter] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const filterRef = useRef({ filter, search }); filterRef.current = { filter, search };
    const { connected, instance } = ServerContext.useStoreState(s => s.socket);
    const status = ServerContext.useStoreState(s => s.status.value);
    const id = ServerContext.useStoreState(s => s.server.data!.id);
    const blocked = ServerContext.useStoreState(s => s.server.inConflictState);
    const [canSend] = usePermissions(['control.console']);
    const terminal = useMemo(() => new Terminal({ disableStdin: true, cursorBlink: false, cursorStyle: 'underline', fontSize: 12, fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace', lineHeight: 1.25, scrollback: 5000, theme: { background: '#101319', foreground: '#d4dbe6', cursor: 'transparent', selection: '#ff9b5250' } }), []);
    const fit = useMemo(() => new FitAddon(), []);
    const finder = useMemo(() => new SearchAddon(), []);
    const renderLine = (line: string) => design.console_rules.reduce((text,rule)=>rule.search ? text.split(rule.search).join(rule.replacement || '') : text,line.split('[Pterodactyl Daemon]').join(`[${design.options.console_daemon}]`));
    const renderer = useRef(renderLine); renderer.current = renderLine;
    useEffect(() => { setFontSize(design.options.console_font_size); terminal.options.fontFamily = monoFonts[design.options.mono_font]; terminal.options.theme = { background: design.surface, foreground: design.text, cursor: 'transparent' }; if (terminal.element) { redraw(); fit.fit(); } }, [design]);
    const redraw = () => {
        terminal.clear(); terminal.reset();
        const { filter, search } = filterRef.current;
        lines.current.filter(line => matchesLog(line, filter, search)).forEach(line => terminal.writeln(renderer.current(line)));
    };
    useEffect(() => {
        if (!host.current) return;
        terminal.loadAddon(fit); terminal.loadAddon(finder); terminal.loadAddon(new WebLinksAddon()); terminal.loadAddon(new Unicode11Addon());
        terminal.open(host.current); terminal.unicode.activeVersion = '11'; fit.fit();
        terminal.attachCustomKeyEventHandler(event => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'f') { event.preventDefault(); setShowFilter(true); return false; }
            return true;
        });
        const observer = new ResizeObserver(() => { if (host.current?.clientWidth) fit.fit(); });
        observer.observe(host.current);
        return () => { observer.disconnect(); if (frame.current !== null) cancelAnimationFrame(frame.current); terminal.dispose(); };
    }, [terminal, fit, finder]);
    useEffect(() => { terminal.options.fontSize = fontSize; if (terminal.element) fit.fit(); }, [fontSize, terminal, fit]);
    useEffect(() => { if (terminal.element) redraw(); }, [filter, search, terminal]);
    useEffect(() => {
        if (!connected || !instance) return;
        // SEND_LOGS replays the tail on reconnect. Start a fresh buffer to avoid duplicate lines.
        lines.current = []; terminal.reset(); setRevision(n => n + 1);
        const append = (raw: string) => {
            const incoming = raw.replace(/\r\n/g, '\n').replace(/\n$/, '').split('\n');
            for (const line of incoming) {
                lines.current.push(line);
                if (matchesLog(line, filterRef.current.filter, filterRef.current.search)) terminal.writeln(renderer.current(line) + '\x1b[0m');
            }
            if (lines.current.length > 5000) lines.current.splice(0, lines.current.length - 5000);
            if (frame.current === null) frame.current = requestAnimationFrame(() => { frame.current = null; setRevision(n => n + 1); });
        };
        const events = [SocketEvent.CONSOLE_OUTPUT, SocketEvent.INSTALL_OUTPUT, SocketEvent.TRANSFER_LOGS, SocketEvent.DAEMON_MESSAGE, SocketEvent.DAEMON_ERROR];
        events.forEach(event => instance.addListener(event, append)); instance.send(SocketRequest.SEND_LOGS);
        return () => events.forEach(event => instance.removeListener(event, append));
    }, [connected, instance, terminal]);
    const counts = useMemo(() => ({ all: lines.current.length, warning: lines.current.filter(l => logLevel(l) === 'warning').length, error: lines.current.filter(l => logLevel(l) === 'error').length }), [revision]);
    const shown = lines.current.filter(line => matchesLog(line, filter, search));
    const submit = () => {
        const value = command.current?.value || '';
        if (designPreview || !value.trim() || !canSend || !connected || !instance || blocked || status === 'offline') return;
        instance.send('send command', value);
        setHistory(items => [value, ...items].slice(0, 32)); setHistoryIndex(-1);
        if (command.current) command.current.value = '';
    };
    const keyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') { event.preventDefault(); submit(); }
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault(); const next = event.key === 'ArrowUp' ? Math.min(historyIndex + 1, history.length - 1) : Math.max(historyIndex - 1, -1);
            setHistoryIndex(next); event.currentTarget.value = history[next] || '';
        }
    };
    const download = () => {
        const blob = new Blob([shown.map(stripAnsi).join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
        anchor.href = url; anchor.download = `server-${id}-${new Date().toISOString().slice(0, 10)}.log`; anchor.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
    return <div className={styles.wrapper}>
        <div className={styles.toolbar}><div className={styles.tabs} role="group" aria-label={vt('Filtrer la sortie de la console')}>{(['all','warning','error'] as LogLevel[]).map(level => <button type="button" key={level} aria-pressed={filter === level} onClick={() => setFilter(level)}>{vt(level === 'all' ? 'Tout' : level === 'warning' ? 'Avertissements' : 'Erreurs')} <small>{counts[level]}</small></button>)}</div>
            <button type="button" className={styles.download} disabled={!shown.length} onClick={download}>{vt('Télécharger le journal')} ↓</button>
        </div>
        {showFilter && <div className={styles.search}><input autoFocus aria-label={vt('Filtrer le journal')} value={search} onChange={e => setSearch(e.target.value)} placeholder={vt('Rechercher dans le journal…')} /><button type="button" aria-label={vt('Fermer le filtre')} onClick={() => { setShowFilter(false); setSearch(''); }}>×</button></div>}
        <div className={styles.terminal}>
            <div className={styles.fontControls}><button type="button" disabled={fontSize <= 10} aria-label={vt('Réduire le texte de la console')} onClick={() => setFontSize(n => n - 1)}>−</button><button type="button" title={vt('Revenir à 12 pixels')} onClick={() => setFontSize(12)}>{fontSize}</button><button type="button" disabled={fontSize >= 20} aria-label={vt('Agrandir le texte de la console')} onClick={() => setFontSize(n => n + 1)}>+</button></div>
            <div className={styles.output} ref={host} />
            {design.options.console_empty && !lines.current.length && <div className={styles.empty}><span>⏻</span><strong>{!connected ? vt('Connexion à la console…') : status === 'offline' ? vt('Serveur hors ligne') : vt('En attente de journaux')}</strong><p>{status === 'offline' && connected ? vt('Démarrez le serveur pour recevoir sa sortie ici.') : vt('Les messages du serveur apparaîtront ici.')}</p></div>}
            {!!lines.current.length && !shown.length && <div className={styles.empty}><strong>{vt('Aucun message pour ce filtre.')}</strong></div>}
        </div>
        <div className={styles.command}><span aria-hidden="true">{design.options.console_prompt}</span><input ref={command} type="text" aria-label={vt('Commande à envoyer au serveur')} placeholder={vt('Commande…')} disabled={!canSend || !connected || !instance || blocked || status === 'offline'} onKeyDown={keyDown} autoComplete="off" spellCheck={false} autoCorrect="off" autoCapitalize="none" />
            {canSend && <button type="button" title={vt('Envoyer')} aria-label={vt('Envoyer')} disabled={!connected || blocked || status === 'offline'} onClick={submit}><FontAwesomeIcon icon={faPaperPlane} /></button>}
            <button type="button" title={vt('Filtrer la sortie')} aria-label={vt('Filtrer la sortie')} aria-pressed={showFilter} onClick={() => { setShowFilter(v => !v); if (showFilter) setSearch(''); }}><FontAwesomeIcon icon={faSearch} /></button>
            <button type="button" title={vt('Historique des commandes')} aria-label={vt('Historique des commandes')} aria-pressed={showHistory} onClick={() => setShowHistory(v => !v)}><FontAwesomeIcon icon={faHistory} /></button>
        </div>
        <CommandRow />

        {showHistory && <div className={styles.history}>{history.length ? history.map((value,index) => <button type="button" key={index} onClick={() => { if (command.current) { command.current.value = value; command.current.focus(); } }}>{value}</button>) : <p>{vt('Aucune commande envoyée pendant cette session.')}</p>}</div>}
    </div>;
}
