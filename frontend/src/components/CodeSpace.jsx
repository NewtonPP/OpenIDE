import React, { useContext, useEffect, useState } from 'react'
import Editor from '@monaco-editor/react';
import { useRef } from 'react';
import { socketCientContext } from '../context/SocketContext';
import { ChevronRightIcon, CloseIcon, CodeIcon, FileIcon, FolderIcon } from './Icons';
import { getLanguage, normalizePath } from '../utils/fileTypes';

const EDITOR_THEME = 'openide-dark'

const defineEditorTheme = (monaco) => {
  monaco.editor.defineTheme(EDITOR_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6a7385', fontStyle: 'italic' },
      { token: 'keyword', foreground: 'c792ea' },
      { token: 'string', foreground: 'a5d6a7' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'type', foreground: '82aaff' },
      { token: 'type.identifier', foreground: 'ffcb6b' },
      { token: 'delimiter', foreground: '89ddff' },
      { token: 'tag', foreground: 'f07178' },
      { token: 'attribute.name', foreground: 'ffcb6b' },
      { token: 'attribute.value', foreground: 'a5d6a7' },
    ],
    colors: {
      'editor.background': '#181a21',
      'editor.foreground': '#d4d7de',
      'editor.lineHighlightBackground': '#1f232c',
      'editor.lineHighlightBorder': '#00000000',
      'editor.selectionBackground': '#2f4a7a',
      'editor.inactiveSelectionBackground': '#2a3446',
      'editorCursor.foreground': '#4c8dff',
      'editorLineNumber.foreground': '#454b5a',
      'editorLineNumber.activeForeground': '#c3c8d2',
      'editorGutter.background': '#181a21',
      'editorIndentGuide.background1': '#252933',
      'editorIndentGuide.activeBackground1': '#3c4250',
      'editorWhitespace.foreground': '#2c303a',
      'editorWidget.background': '#1d2029',
      'editorWidget.border': '#2a2f3a',
      'editorSuggestWidget.background': '#1d2029',
      'editorSuggestWidget.border': '#2a2f3a',
      'editorSuggestWidget.selectedBackground': '#2a3446',
      'editorStickyScroll.background': '#181a21',
      'editorStickyScrollHover.background': '#1f232c',
      'minimap.background': '#181a21',
      'scrollbar.shadow': '#00000000',
      'scrollbarSlider.background': '#ffffff12',
      'scrollbarSlider.hoverBackground': '#ffffff22',
      'scrollbarSlider.activeBackground': '#ffffff30',
    },
  })
}

const EDITOR_OPTIONS = {
  fontSize: 14,
  lineHeight: 22,
  fontFamily: "'JetBrains Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace",
  fontLigatures: true,
  minimap: { enabled: true, renderCharacters: false, scale: 1, maxColumn: 100 },
  smoothScrolling: true,
  cursorBlinking: 'smooth',
  cursorSmoothCaretAnimation: 'on',
  bracketPairColorization: { enabled: true },
  guides: { bracketPairs: 'active', indentation: true },
  padding: { top: 12, bottom: 12 },
  scrollBeyondLastLine: false,
  renderLineHighlight: 'all',
  automaticLayout: true,
  stickyScroll: { enabled: true },
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, useShadows: false },
  overviewRulerBorder: false,
  roundedSelection: true,
  wordWrap: 'off',
}

const Breadcrumbs = ({ path }) => {
  const parts = path.split('/')
  return (
    <div className="flex h-6 shrink-0 items-center gap-0.5 overflow-hidden border-b border-ide-border/60 bg-ide-editor px-3 text-xs text-ide-muted">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1
        return (
          <React.Fragment key={`${part}-${i}`}>
            {i > 0 && <ChevronRightIcon size={12} className="shrink-0 text-ide-subtle" />}
            <span className={`flex shrink-0 items-center gap-1 rounded px-1 ${isLast ? 'text-ide-text' : 'hover:text-ide-text'}`}>
              {isLast ? <FileIcon name={part} size={14} /> : <FolderIcon name={part} size={14} />}
              {part}
            </span>
          </React.Fragment>
        )
      })}
    </div>
  )
}

const Kbd = ({ children }) => (
  <kbd className="min-w-6 rounded border border-ide-border border-b-2 bg-ide-elevated px-1.5 py-0.5 text-center font-mono text-[11px] text-ide-text">
    {children}
  </kbd>
)

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = isMac ? '⌘' : 'Ctrl'

const Welcome = () => (
  <div className="flex h-full w-full select-none items-center justify-center bg-ide-editor p-8">
    <div className="flex max-w-md flex-col items-center text-center">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-linear-to-br from-ide-accent/25 to-violet-500/20 ring-1 ring-ide-accent/30">
        <CodeIcon size={40} strokeWidth={1.5} className="text-ide-accent" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ide-text">OpenIDE</h1>
      <p className="mt-1.5 text-sm text-ide-muted">Select a file from the explorer to start editing.</p>

      <div className="mt-8 grid w-full grid-cols-[1fr_auto] gap-x-6 gap-y-2.5 text-left text-[13px] text-ide-muted">
        <span>Search files</span>
        <span className="flex gap-1"><Kbd>{MOD}</Kbd><Kbd>P</Kbd></span>
        <span>Toggle sidebar</span>
        <span className="flex gap-1"><Kbd>{MOD}</Kbd><Kbd>B</Kbd></span>
        <span>Toggle terminal</span>
        <span className="flex gap-1"><Kbd>Ctrl</Kbd><Kbd>`</Kbd></span>
      </div>
    </div>
  </div>
)

const EditorLoading = () => (
  <div className="flex h-full w-full items-center justify-center gap-2 bg-ide-editor text-sm text-ide-muted">
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-ide-border border-t-ide-accent" />
    Loading editor…
  </div>
)

export const CodeSpace = ({ onStatusChange }) => {
  const {socket} = useContext(socketCientContext)
  const editorRef = useRef(null);
  const [FileCode, setFileCode] = useState()
  const [FilePath, setFilePath] = useState()

  const HandleCodeChange = (text) => {
    setFileCode(text)
    socket.emit('code:changed', text, FilePath)
  }

  useEffect(()=>
  {
    socket.on("file:selected", (code, filepath) => {
      setFileCode(code)
      setFilePath(filepath)
    })

  },[socket])

  // Paths are relative to the workspace, so an open file can't carry over to a different folder.
  useEffect(() => {
    const onWorkspace = () => {
      setFilePath(undefined)
      setFileCode(undefined)
    }
    socket.on('workspace:opened', onWorkspace)
    return () => socket.off('workspace:opened', onWorkspace)
  }, [socket])

  const displayPath = normalizePath(FilePath)

  const openPathRef = useRef(displayPath)
  useEffect(() => {
    openPathRef.current = displayPath
  }, [displayPath])

  // Close the editor if its file (or a folder containing it) was deleted.
  useEffect(() => {
    const onDeleted = (deletedPath) => {
      const deleted = normalizePath(deletedPath)
      const open = openPathRef.current
      if (open && (open === deleted || open.startsWith(`${deleted}/`))) {
        setFilePath(undefined)
        setFileCode(undefined)
      }
    }
    socket.on('file:deleted', onDeleted)
    return () => socket.off('file:deleted', onDeleted)
  }, [socket])
  const fileName = displayPath.split('/').pop()
  const language = getLanguage(displayPath)

  useEffect(() => {
    onStatusChange?.((s) => ({ ...s, filePath: displayPath || null, language: displayPath ? language : null }))
  }, [displayPath, language, onStatusChange])

  const handleMount = (editor) => {
    editor.onDidChangeCursorPosition(({ position }) => {
      onStatusChange?.((s) => ({ ...s, line: position.lineNumber, col: position.column }))
    })
    editor.onDidChangeCursorSelection(({ selection }) => {
      const model = editor.getModel()
      const selected = model ? model.getValueInRange(selection).length : 0
      onStatusChange?.((s) => ({ ...s, selected }))
    })
  }

  const closeFile = () => {
    setFilePath(undefined)
    setFileCode(undefined)
  }

  return (
    <>
    <div ref={editorRef} className='flex h-full w-full flex-col bg-ide-editor'>
      {FilePath ? (
        <>
          <div className="ide-scroll-x flex h-9 shrink-0 items-stretch overflow-x-auto bg-ide-sidebar">
            <div
              title={displayPath}
              className="group relative flex min-w-0 max-w-64 items-center gap-2 border-r border-ide-border bg-ide-editor pl-3 pr-1.5 text-[13px] text-ide-text"
            >
              <span className="absolute inset-x-0 top-0 h-0.5 bg-ide-accent" />
              <FileIcon name={fileName} />
              <span className="truncate">{fileName}</span>
              <button
                type="button"
                title="Close"
                onClick={closeFile}
                className="ml-1 flex h-5 w-5 items-center justify-center rounded text-ide-muted opacity-70 hover:bg-ide-hover hover:text-ide-text group-hover:opacity-100"
              >
                <CloseIcon size={13} />
              </button>
            </div>
            <div className="flex-1 border-b border-ide-border" />
          </div>

          <Breadcrumbs path={displayPath} />

          <div className="min-h-0 flex-1">
            <Editor
              theme={EDITOR_THEME}
              language={language}
              value={FileCode}
              beforeMount={defineEditorTheme}
              onMount={handleMount}
              options={EDITOR_OPTIONS}
              loading={<EditorLoading />}
              onChange={(text)=>{HandleCodeChange(text)}}
            />
          </div>
        </>
      ) : (
        <Welcome />
      )}
    </div>
    </>
  )
}
