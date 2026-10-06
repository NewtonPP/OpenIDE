import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import './App.css'
import {TerminalComponent } from './components/Terminal'
import { FileManager } from './components/FileManager'
import { CodeSpace } from './components/CodeSpace'
import { Madhav } from './components/Madhav'
import { socketCientContext } from './context/SocketContext'
import { CodeIcon, FilesIcon, PanelIcon, SearchIcon, SidebarIcon, SparkleIcon, TerminalIcon } from './components/Icons'
import { getLanguageLabel } from './utils/fileTypes'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

const SIDEBAR = { default: 280, min: 180, max: 600, snap: 120 }
const TERMINAL = { default: 260, min: 100, snap: 60, editorMin: 120 }
const MADHAV_WIDTH = 340

const readStored = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(`openide:${key}`))
    return value ?? fallback
  } catch {
    return fallback
  }
}
const writeStored = (key, value) => {
  try { localStorage.setItem(`openide:${key}`, JSON.stringify(value)) } catch { return }
}

const usePersistentState = (key, fallback) => {
  const [value, setValue] = useState(() => readStored(key, fallback))
  useEffect(() => writeStored(key, value), [key, value])
  return [value, setValue]
}

const Sash = ({ direction, active, onPointerDown, onDoubleClick }) => {
  const horizontal = direction === 'x'
  return (
    <div className={`relative z-20 shrink-0 bg-ide-border ${horizontal ? 'w-px' : 'h-px'}`}>
      <div
        role="separator"
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        onPointerDown={onPointerDown}
        onDoubleClick={onDoubleClick}
        className={`absolute transition-colors delay-100 duration-150 hover:bg-ide-accent
          ${active ? 'bg-ide-accent' : ''}
          ${horizontal ? 'inset-y-0 -left-0.5 w-1 cursor-col-resize' : 'inset-x-0 -top-0.5 h-1 cursor-row-resize'}`}
      />
    </div>
  )
}

const ActivityButton = ({ title, active, onClick, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={`relative flex h-12 w-12 items-center justify-center transition-colors
      ${active ? 'text-ide-text' : 'text-ide-subtle hover:text-ide-text'}`}
  >
    {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-ide-accent" />}
    {children}
  </button>
)

const IconToggle = ({ title, active, onClick, children }) => (
  <button
    type="button"
    title={title}
    aria-label={title}
    onClick={onClick}
    className={`flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-ide-hover
      ${active ? 'text-ide-text' : 'text-ide-subtle'}`}
  >
    {children}
  </button>
)

function App() {
  const { socket } = useContext(socketCientContext)
  const mainRef = useRef(null)

  const [sidebarVisible, setSidebarVisible] = usePersistentState('sidebarVisible', true)
  const [sidebarWidth, setSidebarWidth] = usePersistentState('sidebarWidth', SIDEBAR.default)
  const [terminalVisible, setTerminalVisible] = usePersistentState('terminalVisible', true)
  const [terminalHeight, setTerminalHeight] = usePersistentState('terminalHeight', TERMINAL.default)
  const [terminalMaximized, setTerminalMaximized] = useState(false)
  const [madhavVisible, setMadhavVisible] = usePersistentState('madhavVisible', false)
  const [dragging, setDragging] = useState(null)
  const [focusSearchSignal, setFocusSearchSignal] = useState(0)
  const [connected, setConnected] = useState(() => Boolean(socket?.connected))
  const [status, setStatus] = useState({ filePath: null, language: null, line: 1, col: 1, selected: 0 })

  useEffect(() => {
    if (!socket) return
    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [socket])

  const toggleSidebar = useCallback(() => setSidebarVisible((v) => !v), [setSidebarVisible])
  const toggleMadhav = useCallback(() => setMadhavVisible((v) => !v), [setMadhavVisible])
  const toggleTerminal = useCallback(() => {
    setTerminalVisible((v) => !v)
    setTerminalMaximized(false)
  }, [setTerminalVisible])
  const focusSearch = useCallback(() => {
    setSidebarVisible(true)
    setFocusSearchSignal((n) => n + 1)
  }, [setSidebarVisible])

  useEffect(() => {
    const onKeyDown = (ev) => {
      const mod = isMac ? ev.metaKey : ev.ctrlKey
      const key = ev.key.toLowerCase()
      let handled = true
      if (ev.ctrlKey && ev.code === 'Backquote') toggleTerminal()
      else if (mod && !ev.shiftKey && !ev.altKey && key === 'j') toggleTerminal()
      else if (mod && !ev.shiftKey && !ev.altKey && key === 'b') toggleSidebar()
      else if (mod && !ev.shiftKey && !ev.altKey && key === 'p') focusSearch()
      else if (mod && !ev.shiftKey && !ev.altKey && key === 'i') toggleMadhav()
      else handled = false
      if (handled) {
        ev.preventDefault()
        ev.stopPropagation()
      }
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [toggleTerminal, toggleSidebar, focusSearch, toggleMadhav])

  const startDrag = (ev, axis, onMove) => {
    if (ev.button !== 0) return
    ev.preventDefault()
    setDragging(axis)
    const move = (e) => onMove(e)
    const up = () => {
      setDragging(null)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const startSidebarDrag = (ev) => {
    const startX = ev.clientX
    const startWidth = sidebarWidth
    startDrag(ev, 'x', (e) => {
      const next = startWidth + (e.clientX - startX)
      if (next < SIDEBAR.snap) {
        setSidebarVisible(false)
        return
      }
      setSidebarVisible(true)
      setSidebarWidth(Math.min(SIDEBAR.max, Math.max(SIDEBAR.min, next)))
    })
  }

  const startTerminalDrag = (ev) => {
    startDrag(ev, 'y', (e) => {
      const rect = mainRef.current?.getBoundingClientRect()
      if (!rect) return
      const next = rect.bottom - e.clientY
      if (next < TERMINAL.snap) {
        setTerminalVisible(false)
        return
      }
      setTerminalVisible(true)
      setTerminalHeight(Math.min(rect.height - TERMINAL.editorMin, Math.max(TERMINAL.min, next)))
    })
  }

  const showEditor = !(terminalVisible && terminalMaximized)

  return (
    <>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-ide-bg font-sans text-ide-text antialiased">
        <header className="flex h-10 shrink-0 items-center justify-between gap-4 border-b border-ide-border bg-ide-bg px-3">
          <div className="flex items-center gap-2">
            {/* <div className="flex h-6 w-6 items-center justify-center rounded-md bg-linear-to-br from-ide-accent to-violet-500 text-white shadow-sm shadow-ide-accent/30">
              <CodeIcon size={14} strokeWidth={2.25} />
            </div> */}
            <span className="text-[13px] font-semibold tracking-tight">OpenIDE</span>
          </div>
          <div className="flex items-center justify-end gap-1">
            <IconToggle title={`Toggle Sidebar (${isMac ? '⌘' : 'Ctrl+'}B)`} active={sidebarVisible} onClick={toggleSidebar}>
              <SidebarIcon size={16} />
            </IconToggle>
            <IconToggle title="Toggle Terminal (Ctrl+`)" active={terminalVisible} onClick={toggleTerminal}>
              <PanelIcon size={16} />
            </IconToggle>
            <IconToggle title={`Toggle Madhav (${isMac ? '⌘' : 'Ctrl+'}I)`} active={madhavVisible} onClick={toggleMadhav}>
              <SparkleIcon size={16} />
            </IconToggle>
          </div>
        </header>

        <div className="flex min-h-0 flex-1">
          <nav className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-ide-border bg-ide-bg">
            <div className="flex flex-col">
              <ActivityButton title={`Explorer (${isMac ? '⌘' : 'Ctrl+'}B)`} active={sidebarVisible} onClick={toggleSidebar}>
                <FilesIcon size={22} strokeWidth={1.5} />
              </ActivityButton>
              <ActivityButton title={`Search Files (${isMac ? '⌘' : 'Ctrl+'}P)`} onClick={focusSearch}>
                <SearchIcon size={22} strokeWidth={1.5} />
              </ActivityButton>
              <ActivityButton title={`Madhav (${isMac ? '⌘' : 'Ctrl+'}I)`} active={madhavVisible} onClick={toggleMadhav}>
                <SparkleIcon size={22} strokeWidth={1.5} />
              </ActivityButton>
            </div>
            <ActivityButton title="Toggle Terminal (Ctrl+`)" active={terminalVisible} onClick={toggleTerminal}>
              <TerminalIcon size={22} strokeWidth={1.5} />
            </ActivityButton>
          </nav>

          <aside className="shrink-0 overflow-hidden" style={{ width: sidebarWidth, display: sidebarVisible ? undefined : 'none' }}>
            <FileManager focusSearchSignal={focusSearchSignal} />
          </aside>
          {sidebarVisible && (
            <Sash
              direction="x"
              active={dragging === 'x'}
              onPointerDown={startSidebarDrag}
              onDoubleClick={() => setSidebarWidth(SIDEBAR.default)}
            />
          )}

          <main ref={mainRef} className="flex min-w-0 flex-1 flex-col">
            <div className="min-h-0 flex-1" style={{ display: showEditor ? undefined : 'none' }}>
              <CodeSpace onStatusChange={setStatus} />
            </div>
            {terminalVisible && !terminalMaximized && (
              <Sash
                direction="y"
                active={dragging === 'y'}
                onPointerDown={startTerminalDrag}
                onDoubleClick={() => setTerminalHeight(TERMINAL.default)}
              />
            )}
            <section
              className="min-h-0 shrink-0"
              style={
                !terminalVisible
                  ? { display: 'none' }
                  : terminalMaximized
                    ? { flex: '1 1 0%' }
                    : { height: terminalHeight, maxHeight: `calc(100% - ${TERMINAL.editorMin}px)` }
              }
            >
              <TerminalComponent
                visible={terminalVisible}
                maximized={terminalMaximized}
                onToggleMaximize={() => setTerminalMaximized((m) => !m)}
                onClose={toggleTerminal}
              />
            </section>
          </main>

          {madhavVisible && (
            <aside className="shrink-0 overflow-hidden border-l border-ide-border" style={{ width: MADHAV_WIDTH }}>
              <Madhav onClose={toggleMadhav} />
            </aside>
          )}
        </div>

        <footer className="flex h-6 shrink-0 items-center justify-between border-t border-ide-border bg-ide-bg px-2 text-[11px] text-ide-muted">
          <div className="flex h-full items-center">
            <span
              className={`flex h-full items-center gap-1.5 px-2 ${connected ? '' : 'bg-red-500/15 text-red-300'}`}
              title={connected ? 'Connected to server' : 'Disconnected from server'}
            >
              <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/60' : 'bg-red-400'}`} />
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            <button type="button" onClick={toggleTerminal} className="flex h-full items-center gap-1 px-2 hover:bg-ide-hover hover:text-ide-text">
              <TerminalIcon size={12} strokeWidth={2} />
              Terminal
            </button>
          </div>
          {status.filePath && (
            <div className="flex h-full items-center">
              <span className="px-2">
                Ln {status.line}, Col {status.col}
                {status.selected > 0 && ` (${status.selected} selected)`}
              </span>
              <span className="px-2">{getLanguageLabel(status.language)}</span>
            </div>
          )}
        </footer>

        {dragging && (
          <div className={`fixed inset-0 z-50 ${dragging === 'x' ? 'cursor-col-resize' : 'cursor-row-resize'}`} style={{ userSelect: 'none' }} />
        )}
      </div>
    </>
  )
}

export default App
