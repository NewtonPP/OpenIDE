import { useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, CloseIcon, SendIcon, SparkleIcon } from './Icons'

const MODES = [
  { value: 'agent', label: 'Agent', hint: 'Make changes to your workspace' },
  { value: 'ask', label: 'Ask', hint: 'Ask questions about your code' },
]

export const Madhav = ({ onClose }) => {
  const [mode, setMode] = useState('agent')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])
  const inputRef = useRef(null)
  const listRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages])

  const send = async() => {
    const text = input.trim()
    if (!text) return
    setMessages((prev) => [...prev, { id: Date.now(), mode, text }])
    setInput('')

    const res = await fetch("http://localhost:4000/agent_input", {method:'post', headers:{
      "Content-Type": "application/json"
    }, body:JSON.stringify({prompt:text})})

    const data = await res.json()
    console.log(data.message)
    setMessages((prev) => [...prev, {id: Date.now(), mode, text:data.message}])
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

      <div ref={listRef} className="ide-scroll min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-2">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ide-accent/15 text-ide-accent">
              <SparkleIcon size={20} />
            </div>
            <p className="text-sm font-medium">Ask Madhav</p>
            <p className="text-xs text-ide-muted">{currentMode.hint}.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="rounded-md border border-ide-border bg-ide-bg px-3 py-2">
              <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ide-subtle">
                You · {msg.mode}
              </span>
              <p className="whitespace-pre-wrap break-words text-[13px]">{msg.text}</p>
            </div>
          ))
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
            disabled={!input.trim()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-ide-accent transition-colors hover:bg-ide-hover disabled:cursor-default disabled:text-ide-subtle disabled:hover:bg-transparent"
          >
            <SendIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
