import {Terminal} from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit";
import '@xterm/xterm/css/xterm.css';
import { useEffect, useRef, useState , useContext} from "react";
import {socketCientContext} from "../context/SocketContext"
import { ChevronDownIcon, ChevronUpIcon, CloseIcon, TerminalIcon, TrashIcon } from "./Icons";

const TERMINAL_THEME = {
    background: '#13151b',
    foreground: '#d4d7de',
    cursor: '#4c8dff',
    cursorAccent: '#13151b',
    selectionBackground: '#2f4a7a',
    black: '#1d2029',
    red: '#f07178',
    green: '#a5d6a7',
    yellow: '#ffcb6b',
    blue: '#82aaff',
    magenta: '#c792ea',
    cyan: '#89ddff',
    white: '#d4d7de',
    brightBlack: '#5c6270',
    brightRed: '#ff8b92',
    brightGreen: '#c3e88d',
    brightYellow: '#ffd88a',
    brightBlue: '#9cbcff',
    brightMagenta: '#ddb0f6',
    brightCyan: '#a3ebff',
    brightWhite: '#ffffff',
}

const PanelButton = ({ title, onClick, children }) => (
    <button
        type="button"
        title={title}
        aria-label={title}
        onClick={onClick}
        className="flex h-6 w-6 items-center justify-center rounded text-ide-muted transition-colors hover:bg-ide-hover hover:text-ide-text"
    >
        {children}
    </button>
)

export const TerminalComponent = ({ visible = true, maximized = false, onToggleMaximize, onClose }) => {
    const TerminalRef = useRef(null);
    const ContainerRef = useRef(null);
    const FitRef = useRef(null);

    const [TerminalData, setTerminalData] = useState([]);
    const [size, setSize] = useState(null);

    const {socket} = useContext(socketCientContext)



    useEffect(()=> {
        if (ContainerRef.current == null) return;

        const term = new Terminal({
            cursorBlink: true,
            rows: 10,
            cols: 80,
            fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
            fontSize: 13,
            lineHeight: 1.25,
            scrollback: 5000,
            theme: TERMINAL_THEME,
        });
        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        FitRef.current = fitAddon;

        const handleSocketSendData = (data) =>
        {
            socket.emit('data', data)

        }

        TerminalRef.current = term;
        term.open(ContainerRef.current)

        const disposable = term.onData((text)=>
        {
            handleSocketSendData(text)
        })

        const resizeDisposable = term.onResize(({ cols, rows }) => {
            setSize({ cols, rows })
            socket.emit('resize', { cols, rows })
        })

        const fit = () => {
            const el = ContainerRef.current
            if (!el || el.offsetWidth === 0 || el.offsetHeight === 0) return
            try { fitAddon.fit() } catch { return }
        }
        let frame = 0
        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(fit)
        })
        observer.observe(ContainerRef.current)
        document.fonts?.ready.then(fit)


        socket.on('data', (data)=>{
            term.write(data)
        })

        return () => {
            cancelAnimationFrame(frame)
            observer.disconnect()
            resizeDisposable.dispose()
            disposable.dispose()
            term.dispose()
            TerminalRef.current = null
            FitRef.current = null
        }


    }, [socket])

    useEffect(() => {
        if (visible) requestAnimationFrame(() => TerminalRef.current?.focus())
    }, [visible])

    return (
        <>
        <div className="flex h-full w-full flex-col bg-ide-panel">
            <div className="flex h-9 shrink-0 items-center justify-between pl-4 pr-2">
                <div className="flex h-full items-center gap-5 text-[11px] font-semibold uppercase tracking-[0.1em]">
                    <span className="relative flex h-full items-center gap-1.5 text-ide-text">
                        <TerminalIcon size={14} strokeWidth={2} />
                        Terminal
                        <span className="absolute inset-x-0 bottom-0 h-px bg-ide-accent" />
                    </span>
                </div>
                <div className="flex items-center gap-0.5">
                    {size && (
                        <span className="mr-2 font-mono text-[11px] text-ide-subtle">{size.cols}×{size.rows}</span>
                    )}
                    <PanelButton title="Clear Terminal" onClick={() => TerminalRef.current?.clear()}>
                        <TrashIcon size={14} />
                    </PanelButton>
                    <PanelButton title={maximized ? 'Restore Panel Size' : 'Maximize Panel Size'} onClick={onToggleMaximize}>
                        {maximized ? <ChevronDownIcon size={15} /> : <ChevronUpIcon size={15} />}
                    </PanelButton>
                    <PanelButton title="Hide Panel (Ctrl+`)" onClick={onClose}>
                        <CloseIcon size={15} />
                    </PanelButton>
                </div>
            </div>
            <div
                className="min-h-0 flex-1 pl-4 pr-1 pb-1"
                onClick={() => TerminalRef.current?.focus()}
            >
                <div ref={ContainerRef} className="h-full w-full"/>
            </div>
        </div>
        </>
    )
}
