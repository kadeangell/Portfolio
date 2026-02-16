import { useState, useRef, useEffect, useCallback } from 'react'

export function Terminal() {
  const [input, setInput] = useState('')
  const [cursorPos, setCursorPos] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [focused, setFocused] = useState(true)
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    hiddenInputRef.current?.focus()
  }, [])

  const focusInput = useCallback(() => {
    hiddenInputRef.current?.focus()
  }, [])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      setHistory((prev) => [...prev, `$ ${input}`])
      setInput('')
      setCursorPos(0)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    setCursorPos(e.target.selectionStart ?? e.target.value.length)
  }

  function handleSelect(e: React.SyntheticEvent<HTMLTextAreaElement>) {
    const target = e.target as HTMLTextAreaElement
    setCursorPos(target.selectionStart ?? 0)
  }

  const beforeCursor = input.slice(0, cursorPos)
  const atCursor = input[cursorPos] ?? ' '
  const afterCursor = input.slice(cursorPos + 1)

  return (
    <div
      ref={containerRef}
      onClick={focusInput}
      className="bg-black text-neutral-300 font-mono text-sm leading-relaxed p-28 h-screen w-screen box-border overflow-auto cursor-text"
    >
      <div className="whitespace-pre-wrap break-all">
        {history.map((line, i) => (
          <div key={i} className="min-h-[1.4em]">{line}</div>
        ))}
      </div>
      <div className="flex whitespace-pre">
        <span className="shrink-0">$&nbsp;</span>
        <span>{beforeCursor}</span>
        <span
          className={`inline-block whitespace-pre ${
            focused
              ? 'bg-neutral-300 text-black animate-blink'
              : 'bg-neutral-600 text-black'
          }`}
        >
          {atCursor}
        </span>
        <span>{afterCursor}</span>
      </div>
      <textarea
        ref={hiddenInputRef}
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="absolute -left-[9999px] -top-[9999px] opacity-0 w-0 h-0 p-0 border-none"
        autoComplete="off"
        spellCheck={false}
        rows={1}
      />
    </div>
  )
}
