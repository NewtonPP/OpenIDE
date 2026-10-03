import { getFileVisual, getFolderColor } from '../utils/fileTypes'

const Svg = ({ size = 16, className = '', strokeWidth = 1.75, children, ...rest }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...rest}
  >
    {children}
  </svg>
)

export const ChevronRightIcon = (p) => <Svg {...p}><path d="m9 18 6-6-6-6" /></Svg>
export const ChevronUpIcon = (p) => <Svg {...p}><path d="m18 15-6-6-6 6" /></Svg>
export const ChevronDownIcon = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>
export const SearchIcon = (p) => <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></Svg>
export const CloseIcon = (p) => <Svg {...p}><path d="M18 6 6 18M6 6l12 12" /></Svg>
export const TerminalIcon = (p) => <Svg {...p}><path d="m4 17 6-6-6-6" /><path d="M12 19h8" /></Svg>
export const CodeIcon = (p) => <Svg {...p}><path d="m16 18 6-6-6-6" /><path d="m8 6-6 6 6 6" /></Svg>
export const TrashIcon = (p) => (
  <Svg {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Svg>
)
export const CopyIcon = (p) => (
  <Svg {...p}>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </Svg>
)
export const FilesIcon = (p) => (
  <Svg {...p}>
    <path d="M15 2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7z" />
    <path d="M15 2v5h5" />
    <path d="M4 7v13a2 2 0 0 0 2 2h10" />
  </Svg>
)
export const CollapseAllIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 12h8" />
  </Svg>
)
export const ExpandAllIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M8 12h8M12 8v8" />
  </Svg>
)
export const SidebarIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M9 4v16" />
  </Svg>
)
export const PanelIcon = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <path d="M3 14h18" />
  </Svg>
)
export const FileOutlineIcon = (p) => (
  <Svg {...p}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
  </Svg>
)

const FolderShape = ({ open, color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
    {open ? (
      <>
        <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.38a1.5 1.5 0 0 1 1.06.44L11.5 7h7A1.5 1.5 0 0 1 20 8.5V10H6.5a1.5 1.5 0 0 0-1.42 1.02L3 17z" fill={color} opacity="0.65" />
        <path d="M5.1 11.03A1.5 1.5 0 0 1 6.53 10H21.5a1 1 0 0 1 .95 1.32l-2.1 6.66A1.5 1.5 0 0 1 18.92 19H4.2a1 1 0 0 1-.95-1.32z" fill={color} />
      </>
    ) : (
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.38a1.5 1.5 0 0 1 1.06.44L11.5 7h8A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" fill={color} />
    )}
  </svg>
)

export const FolderIcon = ({ name, open, size }) => (
  <FolderShape open={open} color={getFolderColor(name)} size={size} />
)

export const FileIcon = ({ name, size = 16 }) => {
  const { glyph, kind, color } = getFileVisual(name)

  if (glyph) {
    return (
      <span
        className="inline-flex shrink-0 items-center justify-center font-mono font-bold leading-none tracking-tighter"
        style={{ width: size, height: size, color, fontSize: glyph.length > 2 ? 7 : glyph.length > 1 ? 8.5 : 11 }}
        aria-hidden="true"
      >
        {glyph}
      </span>
    )
  }

  if (kind === 'react') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
        <g fill="none" stroke={color} strokeWidth="1.4">
          <ellipse cx="12" cy="12" rx="10" ry="4" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />
          <ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />
        </g>
        <circle cx="12" cy="12" r="1.9" fill={color} />
      </svg>
    )
  }

  const shared = { size, strokeWidth: 1.75, className: 'shrink-0', style: { color } }
  if (kind === 'image') {
    return (
      <Svg {...shared}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
      </Svg>
    )
  }
  if (kind === 'lock') {
    return (
      <Svg {...shared}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </Svg>
    )
  }
  return <FileOutlineIcon {...shared} />
}
