import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { socketCientContext } from '../context/SocketContext'
import { ArrowUpIcon, CloseIcon, FolderIcon, FolderPlusIcon } from './Icons'

const FooterButton = ({ primary, ...props }) => (
  <button
    type="button"
    {...props}
    className={`h-7 rounded px-3 text-xs font-medium transition-colors disabled:cursor-default disabled:opacity-50
      ${primary
        ? 'bg-ide-accent text-white hover:bg-ide-accent/85'
        : 'border border-ide-border text-ide-text hover:bg-ide-hover'}`}
  />
)

export const OpenFolderDialog = ({ initialPath, onOpened, onClose }) => {
  const { socket } = useContext(socketCientContext)
  const [listing, setListing] = useState(null)
  const [pathInput, setPathInput] = useState(initialPath ?? '')
  const [newFolderName, setNewFolderName] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const listRef = useRef(null)

  const browse = useCallback((dirPath) => {
    socket.emit('dir:list', dirPath, (res) => {
      if (!res.ok) {
        setError(res.error)
        return
      }
      setError(null)
      setListing(res)
      setPathInput(res.path)
      listRef.current?.scrollTo({ top: 0 })
    })
  }, [socket])

  useEffect(() => {
    browse(initialPath)
  }, [browse, initialPath])

  useEffect(() => {
    const onKeyDown = (ev) => ev.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const finish = (res) => {
    setBusy(false)
    if (res.ok) onOpened(res.path)
    else setError(res.error)
  }

  const openCurrent = () => {
    if (!listing) return
    setBusy(true)
    socket.emit('workspace:open', listing.path, finish)
  }

  const createAndOpen = () => {
    const name = newFolderName?.trim()
    if (!name || !listing) return
    setBusy(true)
    socket.emit('dir:create', listing.path, name, finish)
  }

  const join = (name) => `${listing.path.replace(/\/+$/, '')}/${name}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[12vh]" onPointerDown={onClose}>
      <div
        role="dialog"
        aria-label="Open Folder"
        onPointerDown={(ev) => ev.stopPropagation()}
        className="flex max-h-[70vh] w-[min(36rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-lg border border-ide-border bg-ide-elevated text-ide-text shadow-2xl shadow-black/60"
      >
        <div className="flex h-10 shrink-0 items-center justify-between pl-4 pr-2">
          <span className="text-[13px] font-semibold">Open Folder</span>
          <button
            type="button"
            title="Close"
            aria-label="Close"
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded text-ide-muted hover:bg-ide-hover hover:text-ide-text"
          >
            <CloseIcon size={14} />
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 px-3 pb-2">
          <button
            type="button"
            title="Parent folder"
            aria-label="Parent folder"
            disabled={!listing?.parent}
            onClick={() => browse(listing.parent)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-ide-border text-ide-muted hover:bg-ide-hover hover:text-ide-text disabled:opacity-40 disabled:hover:bg-transparent"
          >
            <ArrowUpIcon size={14} />
          </button>
          <input
            value={pathInput}
            onChange={(ev) => setPathInput(ev.target.value)}
            onKeyDown={(ev) => ev.key === 'Enter' && browse(pathInput)}
            spellCheck={false}
            aria-label="Folder path"
            className="h-7 min-w-0 flex-1 rounded border border-ide-border bg-ide-bg px-2 font-mono text-xs text-ide-text focus:border-ide-accent/70 focus:outline-none"
          />
        </div>

        <div ref={listRef} className="ide-scroll min-h-40 flex-1 overflow-y-auto border-y border-ide-border bg-ide-sidebar py-1">
          {!listing ? (
            <div className="px-4 py-6 text-center text-xs text-ide-muted">Loading…</div>
          ) : listing.dirs.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-ide-muted">No subfolders</div>
          ) : (
            listing.dirs.map((name) => (
              <button
                key={name}
                type="button"
                title={join(name)}
                onClick={() => browse(join(name))}
                className="flex h-[26px] w-full items-center gap-2 px-4 text-left text-[13px] text-ide-text/85 hover:bg-ide-hover hover:text-ide-text"
              >
                <FolderIcon name={name} open={false} />
                <span className="truncate">{name}</span>
              </button>
            ))
          )}
        </div>

        {error && <div className="shrink-0 px-4 pt-2 text-xs text-red-300">{error}</div>}

        <div className="flex shrink-0 items-center justify-between gap-2 p-3">
          {newFolderName === null ? (
            <FooterButton disabled={!listing || busy} onClick={() => setNewFolderName('')}>
              <span className="flex items-center gap-1.5"><FolderPlusIcon size={14} />New Folder</span>
            </FooterButton>
          ) : (
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <input
                autoFocus
                value={newFolderName}
                onChange={(ev) => setNewFolderName(ev.target.value)}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter') createAndOpen()
                  else if (ev.key === 'Escape') {
                    ev.stopPropagation()
                    setNewFolderName(null)
                  }
                }}
                placeholder="New folder name"
                spellCheck={false}
                className="h-7 min-w-0 flex-1 rounded border border-ide-accent bg-ide-bg px-2 text-xs text-ide-text placeholder:text-ide-subtle focus:outline-none"
              />
              <FooterButton primary disabled={!newFolderName.trim() || busy} onClick={createAndOpen}>
                Create &amp; Open
              </FooterButton>
            </div>
          )}
          {newFolderName === null && (
            <div className="flex items-center gap-2">
              <FooterButton onClick={onClose}>Cancel</FooterButton>
              <FooterButton primary disabled={!listing || busy} onClick={openCurrent}>Open</FooterButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
