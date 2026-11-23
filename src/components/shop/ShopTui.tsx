import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { PRODUCTS } from '~/shop/products'
import { ModelViewport } from './ModelViewport'

const ACCENT = '#4ade80'
const TYPE_INTERVAL_MS = 22
const DEFAULT_STATUS = 'Use ← → to browse, enter to buy. Drag the model to spin it.'

// The page's CRT shader warps the screen like curved glass: the corners are
// pushed off-screen (black) and the edges are dimmed. So nothing is anchored to
// a corner. Content lives in a centered column with generous padding.

interface TuiButtonProps {
  children: React.ReactNode
  onClick?: () => void
  label?: string
  className?: string
  active?: boolean
}

/** A borderless terminal button: inverts to the accent color on hover, focus and when active. */
function TuiButton({ children, onClick, label, className = '', active }: TuiButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`cursor-pointer px-2 py-0.5 font-mono text-sm outline-none transition-colors hover:bg-[#4ade80] hover:text-black focus-visible:bg-[#4ade80] focus-visible:text-black ${
        active ? 'bg-[#4ade80] text-black' : 'text-[#4ade80]'
      } ${className}`}
    >
      {children}
    </button>
  )
}

/**
 * Types `text` in one character at a time. The not-yet-typed remainder is
 * rendered transparent so the paragraph never reflows while it animates.
 * Skipped for reduced-motion users.
 */
function Typewriter({ text }: { text: string }) {
  const [count, setCount] = useState(0)

  // The parent remounts this component per product (key), so `count` starts at 0.
  // Driven by elapsed time rather than a timer chain, so a busy main thread
  // (the CRT effect makes frames slow) makes it choppier but never slower.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const next = Math.min(text.length, Math.floor((now - start) / TYPE_INTERVAL_MS))
      setCount(next)
      if (next < text.length) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [text])

  return (
    <p className="m-0 text-neutral-300" aria-label={text}>
      <span aria-hidden="true">
        {text.slice(0, count)}
        <span className="opacity-0">{text.slice(count)}</span>
      </span>
    </p>
  )
}

type Choice = 'confirm' | 'cancel'

interface ConfirmDialogProps {
  productName: string
  choice: Choice
  onChoose: (c: Choice) => void
  onRun: (c: Choice) => void
}

function ConfirmDialog({ productName, choice, onChoose, onRun }: ConfirmDialogProps) {
  const ref = useRef<HTMLDivElement>(null)

  // Move focus into the dialog (and give it back on close)
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    return () => previous?.focus?.()
  }, [])

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-[14vw]"
      onClick={() => onRun('cancel')}
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        tabIndex={-1}
        className="max-w-sm bg-neutral-900 px-6 py-5 text-center outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="m-0 text-base font-bold" style={{ color: ACCENT }}>
          Purchase the {productName}?
        </h2>
        <p id="confirm-body" className="mb-4 mt-2 text-neutral-400">
          Checkout isn't open yet, so nothing will be charged.
        </p>
        <div className="flex justify-center gap-4">
          <span onMouseEnter={() => onChoose('confirm')}>
            <TuiButton onClick={() => onRun('confirm')} active={choice === 'confirm'}>
              [ confirm ]
            </TuiButton>
          </span>
          <span onMouseEnter={() => onChoose('cancel')}>
            <TuiButton onClick={() => onRun('cancel')} active={choice === 'cancel'}>
              [ cancel ]
            </TuiButton>
          </span>
        </div>
        <p className="mb-0 mt-3 text-xs text-neutral-600">← → choose · enter select · esc cancel</p>
      </div>
    </div>
  )
}

export function ShopTui() {
  const [selected, setSelected] = useState(0)
  const [status, setStatus] = useState(DEFAULT_STATUS)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [choice, setChoice] = useState<Choice>('confirm')
  const product = PRODUCTS[selected]

  const select = useCallback((i: number) => {
    const next = (i + PRODUCTS.length) % PRODUCTS.length
    setSelected(next)
    setStatus(DEFAULT_STATUS)
  }, [])

  const openDialog = useCallback(() => {
    setChoice('confirm')
    setDialogOpen(true)
  }, [])

  const runChoice = useCallback(
    (c: Choice) => {
      setDialogOpen(false)
      setStatus(
        c === 'confirm'
          ? `No order placed for the ${product.name}: checkout isn't open yet. Nothing was charged.`
          : `Cancelled. Back to browsing the ${product.name}.`,
      )
    },
    [product.name],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (dialogOpen) {
        // Modal: swallow everything except the dialog's own keys
        if (e.key === 'Escape') {
          e.preventDefault()
          runChoice('cancel')
        } else if (e.key === 'Enter') {
          e.preventDefault()
          if (!e.repeat) runChoice(choice)
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'Tab') {
          e.preventDefault()
          setChoice((c) => (c === 'confirm' ? 'cancel' : 'confirm'))
        }
        return
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        if (!e.repeat) openDialog()
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        e.preventDefault()
        select(selected + 1)
      } else if (e.key === 'ArrowLeft' || e.key === 'h') {
        e.preventDefault()
        select(selected - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selected, select, dialogOpen, choice, openDialog, runChoice])

  return (
    <div className="flex h-screen w-screen flex-col bg-black px-[11vw] py-[9vh] font-mono text-sm text-neutral-300">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col text-center">
        <h1 className="m-0 text-sm font-bold tracking-widest" style={{ color: ACCENT }}>
          ◆ SHAPE SHOP
        </h1>

        {/* Model with prev/next arrows */}
        <div className="mt-2 flex min-h-0 flex-1 items-stretch gap-2">
          <div className="flex items-center">
            <TuiButton onClick={() => select(selected - 1)} label="Previous item (←)" className="py-6 text-lg">
              ◀
            </TuiButton>
          </div>
          <div className="min-h-0 min-w-0 flex-1">
            <ModelViewport key={product.id} model={product.model} />
          </div>
          <div className="flex items-center">
            <TuiButton onClick={() => select(selected + 1)} label="Next item (→)" className="py-6 text-lg">
              ▶
            </TuiButton>
          </div>
        </div>

        {/* Position dots */}
        <nav aria-label="Items" className="mt-2 flex justify-center gap-1">
          {PRODUCTS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => select(i)}
              aria-label={`Show ${p.name}`}
              aria-current={i === selected}
              title={p.name}
              className={`cursor-pointer px-1.5 py-1 text-base leading-none outline-none transition-colors focus-visible:bg-[#4ade80] focus-visible:text-black ${
                i === selected ? 'text-[#4ade80]' : 'text-neutral-600 hover:text-[#4ade80]'
              }`}
            >
              {i === selected ? '●' : '○'}
            </button>
          ))}
        </nav>

        {/* Detail */}
        <section className="mt-3">
          <div className="flex flex-wrap items-baseline justify-center gap-x-3">
            <h2 className="m-0 text-base font-bold" style={{ color: ACCENT }}>
              {product.name}
            </h2>
            <span className="text-neutral-500">{product.tagline}</span>
          </div>
          <div className="mx-auto my-1 min-h-[3.6em] max-w-prose">
            <Typewriter key={product.id} text={product.description} />
          </div>
          <p className="m-0 text-xs text-neutral-500">
            {product.model.vertexCount} vertices · {product.model.faceCount} faces · .obj
          </p>
          <div className="mt-3 flex justify-center gap-4">
            <TuiButton onClick={openDialog} label="Buy (enter)">
              [ buy ]
            </TuiButton>
            <Link to="/" className="no-underline" aria-label="Exit the shop">
              <span className="inline-block cursor-pointer px-2 py-0.5 text-[#4ade80] transition-colors hover:bg-[#4ade80] hover:text-black">
                [ exit ]
              </span>
            </Link>
          </div>
        </section>

        {/* Status bar */}
        <footer className="mt-3 min-h-[1.2em] text-xs text-neutral-500" aria-live="polite">
          {status}
        </footer>
      </div>

      {dialogOpen && (
        <ConfirmDialog
          productName={product.name}
          choice={choice}
          onChoose={setChoice}
          onRun={runChoice}
        />
      )}
    </div>
  )
}
