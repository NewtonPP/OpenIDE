import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { socketCientContext } from '../context/SocketContext'
import {
  ChevronRightIcon, CloseIcon, CollapseAllIcon, CopyIcon, ExpandAllIcon,
  FileIcon, FolderIcon, SearchIcon,
} from './Icons'
import { normalizePath } from '../utils/fileTypes'

const ROW_HEIGHT = 22
const INDENT = 12

const toTree = (obj, parentPath = '') =>
  Object.entries(obj || {})
    .map(([name, value]) => {
      const path = parentPath ? `${parentPath}/${name}` : name
      const isDirectory = value !== null && typeof value === 'object'
      return {
        name,
        path,
        type: isDirectory ? 'directory' : 'file',
        children: isDirectory ? toTree(value, path) : [],
      }
    })
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1
      return a.name.localeCompare(b.name)
    })

const filterTree = (nodes, query) =>
  nodes.reduce((acc, node) => {
    const matches = node.name.toLowerCase().includes(query)
    if (node.type === 'directory') {
      const children = filterTree(node.children, query)
      if (children.length || matches) acc.push({ ...node, children: children.length ? children : node.children })
    } else if (matches) {
      acc.push(node)
    }
    return acc
  }, [])

const collectDirectories = (nodes, acc = []) => {
  nodes.forEach((node) => {
    if (node.type === 'directory') {
      acc.push(node.path)
      collectDirectories(node.children, acc)
    }
  })
  return acc
}

const countFiles = (nodes) =>
  nodes.reduce((sum, node) => sum + (node.type === 'directory' ? countFiles(node.children) : 1), 0)

const HighlightedName = ({ name, query }) => {
  if (!query) return name
  const idx = name.toLowerCase().indexOf(query)
  if (idx === -1) return name
  return (
    <>
      {name.slice(0, idx)}
      <span className="rounded-sm bg-ide-accent/30 text-white">{name.slice(idx, idx + query.length)}</span>
      {name.slice(idx + query.length)}
    </>
  )
}

const ToolbarButton = ({ title, onClick, children }) => (
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

const FileNode = ({ node, level = 0, filePath, openFolders, forceOpen, toggleFolder, activePath, onFileSelect, onContextMenu, query }) => {
  const isDirectory = node.type === 'directory'
  const isOpen = isDirectory && (forceOpen || openFolders.has(node.path))
  const isActive = !isDirectory && activePath === node.path

  const HandleFileClick = (ev, filePath, node) => {
    ev.stopPropagation()

    if (node.type === 'directory') return

    const selectedFile = filePath === '.'
      ? node.name
      : `.${filePath}`

    onFileSelect(selectedFile, node)
  }

  const activate = (ev) => {
    isDirectory && toggleFolder(node.path)
    HandleFileClick(ev, filePath, node)
  }

  return (
    <div role="none">
      <div
        role="treeitem"
        tabIndex={0}
        aria-expanded={isDirectory ? isOpen : undefined}
        aria-selected={isActive}
        title={node.path}
        onClick={activate}
        onKeyDown={(ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault()
            activate(ev)
          } else if (isDirectory && ev.key === 'ArrowRight' && !isOpen) {
            toggleFolder(node.path)
          } else if (isDirectory && ev.key === 'ArrowLeft' && isOpen) {
            toggleFolder(node.path)
          }
        }}
        onContextMenu={(ev) => onContextMenu(ev, node)}
        className={`group/row relative flex cursor-pointer select-none items-center gap-1.5 pr-2 text-[13px] outline-none
          focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ide-accent
          ${isActive
            ? 'bg-ide-accent/15 text-white'
            : 'text-ide-text/85 hover:bg-ide-hover hover:text-ide-text'}`}
        style={{ paddingLeft: `${level * INDENT + 8}px`, height: ROW_HEIGHT }}
      >
        {isActive && <span className="absolute inset-y-0 left-0 w-0.5 bg-ide-accent" />}
        <span className="flex w-4 shrink-0 items-center justify-center text-ide-muted">
          {isDirectory && (
            <ChevronRightIcon size={14} strokeWidth={2} className={`transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} />
          )}
        </span>
        {isDirectory ? <FolderIcon name={node.name} open={isOpen} /> : <FileIcon name={node.name} />}
        <span className="truncate">
          <HighlightedName name={node.name} query={query} />
        </span>
      </div>

      {isDirectory && isOpen && (
        <div role="group" className="relative">
          <span
            className="pointer-events-none absolute inset-y-0 w-px bg-ide-border transition-colors group-hover/tree:bg-ide-subtle/50"
            style={{ left: `${level * INDENT + 16}px` }}
          />
          {node.children.length === 0 ? (
            <div
              className="flex items-center text-xs italic text-ide-subtle"
              style={{ paddingLeft: `${(level + 1) * INDENT + 30}px`, height: ROW_HEIGHT }}
            >
              Empty folder
            </div>
          ) : (
            node.children.map((child) => (
              <FileNode
                key={child.path}
                node={child}
                level={level + 1}
                filePath={'/' + child.path}
                openFolders={openFolders}
                forceOpen={forceOpen}
                toggleFolder={toggleFolder}
                activePath={activePath}
                onFileSelect={onFileSelect}
                onContextMenu={onContextMenu}
                query={query}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

const ContextMenu = ({ menu, onClose, actions }) => {
  const ref = useRef(null)

  useEffect(() => {
    const close = (ev) => {
      if (ev.type === 'keydown' && ev.key !== 'Escape') return
      if (ev.type === 'pointerdown' && ref.current?.contains(ev.target)) return
      onClose()
    }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', close)
    window.addEventListener('blur', close)
    window.addEventListener('resize', close)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', close)
      window.removeEventListener('blur', close)
      window.removeEventListener('resize', close)
    }
  }, [onClose])

  const left = Math.min(menu.x, window.innerWidth - 220)
  const top = Math.min(menu.y, window.innerHeight - actions.length * 30 - 16)

  return (
    <div
      ref={ref}
      role="menu"
      className="fixed z-50 min-w-52 rounded-md border border-ide-border bg-ide-elevated py-1 text-[13px] text-ide-text shadow-2xl shadow-black/50"
      style={{ left, top }}
    >
      {actions.map((action) =>
        action.divider ? (
          <div key={action.key} className="my-1 h-px bg-ide-border" />
        ) : (
          <button
            key={action.key}
            role="menuitem"
            type="button"
            onClick={() => {
              action.onClick()
              onClose()
            }}
            className="flex w-full items-center gap-2.5 px-3 py-1 text-left hover:bg-ide-accent hover:text-white"
          >
            <span className="flex w-4 justify-center opacity-80">{action.icon}</span>
            <span className="flex-1">{action.label}</span>
            {action.hint && <span className="text-xs opacity-60">{action.hint}</span>}
          </button>
        )
      )}
    </div>
  )
}

export const FileManager = ({ focusSearchSignal = 0 }) => {
  const { socket } = useContext(socketCientContext)
  const [files, setFiles] = useState(null)
  const [openFolders, setOpenFolders] = useState(() => new Set())
  const [query, setQuery] = useState('')
  const [activePath, setActivePath] = useState(null)
  const [workspaceOpen, setWorkspaceOpen] = useState(true)
  const [menu, setMenu] = useState(null)
  const [toast, setToast] = useState(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!socket) return

    const receiveFiles = (data) => {
      setFiles(data)
    }
    socket.on('files', receiveFiles)

    return () => socket.off('files', receiveFiles)
  }, [socket])

  useEffect(() => {
    if (!socket) return
    const onSelected = (_code, filepath) => setActivePath(normalizePath(filepath))
    socket.on('file:selected', onSelected)
    return () => socket.off('file:selected', onSelected)
  }, [socket])

  useEffect(() => {
    if (focusSearchSignal > 0) {
      searchRef.current?.focus()
      searchRef.current?.select()
    }
  }, [focusSearchSignal])

  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(null), 1600)
    return () => clearTimeout(id)
  }, [toast])

  const tree = useMemo(() => (files ? toTree(files) : null), [files])
  const normalizedQuery = query.trim().toLowerCase()
  const visibleTree = useMemo(
    () => (tree && normalizedQuery ? filterTree(tree, normalizedQuery) : tree),
    [tree, normalizedQuery]
  )
  const fileCount = useMemo(() => (tree ? countFiles(tree) : 0), [tree])

  const toggleFolder = useCallback((path) => {
    setOpenFolders((prev) => {
      const next = new Set(prev)
      next.has(path) ? next.delete(path) : next.add(path)
      return next
    })
  }, [])

  const collapseAll = () => setOpenFolders(new Set())
  const expandAll = () => tree && setOpenFolders(new Set(collectDirectories(tree)))

  const onFileSelect = useCallback((selectedFile, node) => {
    setActivePath(node.path)
    socket.emit('file:select', selectedFile)
  }, [socket])

  const onContextMenu = useCallback((ev, node) => {
    ev.preventDefault()
    ev.stopPropagation()
    setMenu({ x: ev.clientX, y: ev.clientY, node })
  }, [])

  const closeMenu = useCallback(() => setMenu(null), [])

  const copy = (text, label) => {
    navigator.clipboard?.writeText(text).then(
      () => setToast(`${label} copied`),
      () => setToast('Could not access clipboard')
    )
  }

  const menuActions = (node) => {
    const isDirectory = node.type === 'directory'
    return [
      isDirectory
        ? {
            key: 'toggle',
            label: openFolders.has(node.path) ? 'Collapse Folder' : 'Expand Folder',
            icon: <ChevronRightIcon size={14} />,
            onClick: () => toggleFolder(node.path),
          }
        : {
            key: 'open',
            label: 'Open File',
            icon: <FileIcon name={node.name} size={14} />,
            onClick: () => onFileSelect(node.path.includes('/') ? `./${node.path}` : node.name, node),
          },
      { key: 'd1', divider: true },
      { key: 'path', label: 'Copy Path', icon: <CopyIcon size={14} />, onClick: () => copy(node.path, 'Path') },
      { key: 'name', label: 'Copy Name', icon: <CopyIcon size={14} />, onClick: () => copy(node.name, 'Name') },
      { key: 'd2', divider: true },
      { key: 'collapse', label: 'Collapse All Folders', icon: <CollapseAllIcon size={14} />, onClick: collapseAll },
    ]
  }

  return (
    <div className="flex h-full w-full flex-col bg-ide-sidebar text-ide-text">
      <div className="flex h-9 shrink-0 items-center justify-between pl-4 pr-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ide-muted">Explorer</span>
        <div className="flex items-center gap-0.5">
          <ToolbarButton title="Search files (⌘/Ctrl+P)" onClick={() => searchRef.current?.focus()}>
            <SearchIcon size={15} />
          </ToolbarButton>
          <ToolbarButton title="Expand All" onClick={expandAll}>
            <ExpandAllIcon size={15} />
          </ToolbarButton>
          <ToolbarButton title="Collapse All" onClick={collapseAll}>
            <CollapseAllIcon size={15} />
          </ToolbarButton>
        </div>
      </div>

      <div className="shrink-0 px-3 pb-2">
        <div className="group flex h-7 items-center gap-2 rounded-md border border-ide-border bg-ide-bg px-2 transition-colors focus-within:border-ide-accent/70 focus-within:ring-2 focus-within:ring-ide-accent/20">
          <SearchIcon size={13} className="shrink-0 text-ide-subtle group-focus-within:text-ide-accent" />
          <input
            ref={searchRef}
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            onKeyDown={(ev) => ev.key === 'Escape' && (setQuery(''), ev.currentTarget.blur())}
            placeholder="Filter files…"
            spellCheck={false}
            className="w-full bg-transparent text-xs text-ide-text placeholder:text-ide-subtle focus:outline-none"
          />
          {query && (
            <button
              type="button"
              title="Clear filter"
              onClick={() => setQuery('')}
              className="flex h-4 w-4 items-center justify-center rounded text-ide-muted hover:bg-ide-hover hover:text-ide-text"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setWorkspaceOpen((o) => !o)}
        className="flex h-6 shrink-0 items-center gap-1 border-y border-ide-border/60 px-1.5 text-[11px] font-bold uppercase tracking-wider text-ide-text/90 hover:bg-ide-hover"
      >
        <ChevronRightIcon size={14} strokeWidth={2.25} className={`transition-transform duration-150 ${workspaceOpen ? 'rotate-90' : ''}`} />
        <span className="flex-1 truncate text-left">Workspace</span>
        {tree && (
          <span className="rounded-full bg-ide-hover px-1.5 py-px text-[10px] font-medium normal-case tracking-normal text-ide-muted">
            {fileCount} {fileCount === 1 ? 'file' : 'files'}
          </span>
        )}
      </button>

      {workspaceOpen && (
        <div role="tree" className="group/tree ide-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1">
          {!visibleTree ? (
            <div className="space-y-1.5 px-4 py-2" aria-label="Loading files">
              {[70, 55, 80, 45, 62, 50].map((w, i) => (
                <div key={i} className="flex items-center gap-2" style={{ paddingLeft: i % 3 === 2 ? 16 : 0 }}>
                  <div className="h-3.5 w-3.5 animate-pulse rounded bg-ide-hover" />
                  <div className="h-2.5 animate-pulse rounded bg-ide-hover" style={{ width: `${w}%` }} />
                </div>
              ))}
            </div>
          ) : visibleTree.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-ide-muted">
              {normalizedQuery ? (
                <>
                  No files match <span className="font-medium text-ide-text">“{query.trim()}”</span>
                </>
              ) : (
                'This workspace is empty.'
              )}
            </div>
          ) : (
            visibleTree.map((node) => (
              <FileNode
                key={node.path}
                node={node}
                filePath={`.`}
                openFolders={openFolders}
                forceOpen={Boolean(normalizedQuery)}
                toggleFolder={toggleFolder}
                activePath={activePath}
                onFileSelect={onFileSelect}
                onContextMenu={onContextMenu}
                query={normalizedQuery}
              />
            ))
          )}
        </div>
      )}

      {toast && (
        <div className="pointer-events-none mx-3 mb-3 rounded-md border border-ide-border bg-ide-elevated px-3 py-1.5 text-center text-xs text-ide-text shadow-lg">
          {toast}
        </div>
      )}

      {menu && <ContextMenu menu={menu} onClose={closeMenu} actions={menuActions(menu.node)} />}
    </div>
  )
}
