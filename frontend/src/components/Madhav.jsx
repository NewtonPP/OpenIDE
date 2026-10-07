import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { ChevronDownIcon, CloseIcon, SendIcon, SparkleIcon } from './Icons'

const MODES = [
  { value: 'agent', label: 'Agent', hint: 'Make changes to your workspace' },
  { value: 'ask', label: 'Ask', hint: 'Ask questions about your code' },
]

let nextId = 0
const newId = () => ++nextId

const AssistantAvatar = () => (
  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ide-accent/15 text-ide-accent">
    <SparkleIcon size={13} />
  </div>
)

const UserMessage = ({ msg }) => (
  <div className="flex flex-col items-end gap-1 pl-8">
    <span className="pr-1 text-[10px] font-semibold uppercase tracking-wider text-ide-subtle">
      You · {msg.mode}
    </span>
    <div className="max-w-full rounded-lg rounded-tr-sm bg-[#3a3d45] px-3 py-2 text-white">
      <p className="whitespace-pre-wrap break-words text-[13px]">{msg.text}</p>
    </div>
  </div>
)

// Styles for markdown in agent replies (rendered on the light gray bubble)
const markdownComponents = {
  h1: (props) => <h1 className="mt-3 mb-1.5 text-[15px] font-semibold first:mt-0" {...props} />,
  h2: (props) => <h2 className="mt-3 mb-1.5 text-[14px] font-semibold first:mt-0" {...props} />,
  h3: (props) => <h3 className="mt-2.5 mb-1 text-[13px] font-semibold first:mt-0" {...props} />,
  p: (props) => <p className="my-1.5 leading-relaxed first:mt-0 last:mb-0" {...props} />,
  ul: (props) => <ul className="my-1.5 list-disc space-y-0.5 pl-5" {...props} />,
  ol: (props) => <ol className="my-1.5 list-decimal space-y-0.5 pl-5" {...props} />,
  li: (props) => <li className="leading-relaxed" {...props} />,
  a: (props) => <a className="text-blue-700 underline" target="_blank" rel="noreferrer" {...props} />,
  strong: (props) => <strong className="font-semibold" {...props} />,
  blockquote: (props) => <blockquote className="my-1.5 border-l-2 border-gray-400 pl-3 text-gray-600" {...props} />,
  hr: () => <hr className="my-3 border-gray-300" />,
  table: (props) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[12px]" {...props} />
    </div>
  ),
  th: (props) => <th className="border border-gray-300 bg-gray-300/60 px-2 py-1 text-left font-semibold" {...props} />,
  td: (props) => <td className="border border-gray-300 px-2 py-1" {...props} />,
  pre: (props) => (
    <pre className="ide-scroll my-2 overflow-x-auto rounded-md bg-ide-elevated px-3 py-2 font-mono text-[12px] leading-5 text-ide-text" {...props} />
  ),
  code: ({ className, children, ...props }) => {
    // Fenced blocks get a language-* class or contain newlines; everything else is inline
    const isBlock = /language-/.test(className || '') || String(children).includes('\n')
    if (isBlock) return <code className={`font-mono ${className || ''}`} {...props}>{children}</code>
    return <code className="rounded bg-gray-500 px-1 py-0.5 font-mono text-[12px] text-white" {...props}>{children}</code>
  },
}

const AssistantMessage = ({ msg }) => (
  <div className="flex gap-2 pr-4">
    <AssistantAvatar />
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white">Madhav</span>
      {msg.error ? (
        <div className="rounded-lg rounded-tl-sm border border-red-500/40 bg-red-500/10 px-3 py-2 text-red-300">
          <p className="whitespace-pre-wrap break-words text-[13px]">{msg.text}</p>
        </div>
      ) : (
        <div className="break-words rounded-lg rounded-tl-sm bg-[#000000] px-3 py-2 text-[13px] text-white">
          <Markdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{msg.text}</Markdown>
        </div>
      )}
    </div>
  </div>
)

const ThinkingMessage = () => (
  <div className="flex gap-2 pr-4">
    <AssistantAvatar />
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-ide-accent">Madhav</span>
      <div className="flex items-center gap-1 rounded-lg rounded-tl-sm bg-[#e4e5e8] px-3 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-500" />
      </div>
    </div>
  </div>
)

export const Madhav = ({ onClose }) => {
  const [mode, setMode] = useState('agent')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const [pending, setPending] = useState(false)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, pending])

  const send = async() => {
    const text = input.trim()
    if (!text || pending) return
    setMessages((prev) => [...prev, { id: newId(), role: 'user', mode, text }])
    setInput('')
    setPending(true)

    try {
      const res = await fetch("http://localhost:4000/agent_input", {method:'post', headers:{
        "Content-Type": "application/json"
      }, body:JSON.stringify({prompt:text})})

      const data = await res.json()
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', mode, text: data.message }])
    } catch (err) {
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', mode, error: true, text: `Request failed: ${err.message}` }])
    } finally {
      setPending(false)
    }
  }

  const currentMode = MODES.find((m) => m.value === mode)

  return (
    <div className="flex h-full w-full flex-col bg-ide-sidebar text-ide-text">
      <div className="flex h-9 shrink-0 items-center justify-between pl-4 pr-2">
        <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ide-muted">
          <SparkleIcon size={13} className="text-ide-accent" />
          Madhav
        </span>
        <button
          type="button"
          title="Close Madhav"
          aria-label="Close Madhav"
          onClick={onClose}
          className="flex h-6 w-6 items-center justify-center rounded text-ide-muted transition-colors hover:bg-ide-hover hover:text-ide-text"
        >
          <CloseIcon size={14} />
        </button>
      </div>

      <div ref={listRef} className="ide-scroll min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ide-accent/15 text-ide-accent">
              <SparkleIcon size={20} />
            </div>
            <p className="text-sm font-medium">Ask Madhav</p>
            <p className="text-xs text-ide-muted">{currentMode.hint}.</p>
          </div>
        ) : (
          <>
            {messages.map((msg) =>
              msg.role === 'user'
                ? <UserMessage key={msg.id} msg={msg} />
                : <AssistantMessage key={msg.id} msg={msg} />
            )}
            {pending && <ThinkingMessage />}
          </>
        )}
      </div>

      <div className="shrink-0 p-2">
        <div className="flex items-end gap-1.5 rounded-md border border-ide-border bg-ide-bg p-1.5 transition-colors focus-within:border-ide-accent/70 focus-within:ring-2 focus-within:ring-ide-accent/20">
          <label className="relative flex h-7 shrink-0 items-center" title={currentMode.hint}>
            <span className="sr-only">Mode</span>
            <select
              value={mode}
              onChange={(ev) => setMode(ev.target.value)}
              className="h-full cursor-pointer appearance-none rounded bg-ide-hover pl-2 pr-6 text-xs font-medium text-ide-text focus:outline-none"
            >
              {MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <ChevronDownIcon size={12} className="pointer-events-none absolute right-1.5 text-ide-muted" />
          </label>
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(ev) => setInput(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter' && !ev.shiftKey) {
                ev.preventDefault()
                send()
              }
            }}
            placeholder={mode === 'agent' ? 'Tell Madhav what to do…' : 'Ask Madhav a question…'}
            spellCheck={false}
            className="ide-scroll max-h-40 min-h-7 min-w-0 flex-1 resize-none bg-transparent py-1 text-[13px] leading-5 text-ide-text [field-sizing:content] placeholder:text-ide-subtle focus:outline-none"
          />
          <button
            type="button"
            title="Send (Enter)"
            aria-label="Send"
            onClick={send}
            disabled={!input.trim() || pending}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-ide-accent transition-colors hover:bg-ide-hover disabled:cursor-default disabled:text-ide-subtle disabled:hover:bg-transparent"
          >
            <SendIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
