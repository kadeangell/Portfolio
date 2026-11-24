import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { PRODUCTS, productViews } from '~/shop/products'
import { ModelViewport } from './ModelViewport'

const ACCENT = '#4ade80'
const TYPE_INTERVAL_MS = 22
const DEFAULT_STATUS = 'Use ← → to browse, enter for details, ctrl+c to exit. Drag the model to spin it.'
const DETAIL_STATUS = '← → change view · enter to buy · esc back · ctrl+c exit'

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
          Press enter to continue to checkout.
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
        <p className="mb-0 mt-3 text-xs text-neutral-600">← → choose · enter select · esc back</p>
      </div>
    </div>
  )
}

interface CheckoutDialogProps {
  productName: string
  onDone: () => void
  onBack: () => void
}

function CheckoutDialog({ productName, onDone, onBack }: CheckoutDialogProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    ref.current?.focus()
    return () => previous?.focus?.()
  }, [])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-[14vw]" onClick={onBack}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
        tabIndex={-1}
        className="max-w-sm bg-neutral-900 px-6 py-5 text-center outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="checkout-title" className="m-0 text-base font-bold" style={{ color: ACCENT }}>
          ◆ CHECKOUT
        </h2>
        <p className="mb-0 mt-3 text-neutral-300">1 × {productName}</p>
        <p className="mb-4 mt-2 text-neutral-400">Checkout isn't open yet. Nothing was charged.</p>
        <TuiButton onClick={onDone}>[ back to the shop ]</TuiButton>
        <p className="mb-0 mt-3 text-xs text-neutral-600">enter back to the shop · esc back to details</p>
      </div>
    </div>
  )
}

type Stage = 'browse' | 'detail' | 'confirm' | 'checkout'

export function ShopTui() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(0)
  const [status, setStatus] = useState(DEFAULT_STATUS)
  const [stage, setStage] = useState<Stage>('browse')
  const [viewIdx, setViewIdx] = useState(0)
  const [choice, setChoice] = useState<Choice>('confirm')
  const product = PRODUCTS[selected]
  const views = useMemo(() => productViews(product), [product])
  const view = views[viewIdx] ?? views[0]

  const select = useCallback((i: number) => {
    const next = (i + PRODUCTS.length) % PRODUCTS.length
    setSelected(next)
    setStatus(DEFAULT_STATUS)
  }, [])

  const selectView = useCallback(
    (i: number) => setViewIdx((i + views.length) % views.length),
    [views.length],
  )

  const goDetail = useCallback(() => {
    setStage('detail')
    setViewIdx(0)
    setStatus(DETAIL_STATUS)
  }, [])

  // Enter walks browse -> detail -> confirm -> checkout
  const advance = useCallback(() => {
    if (stage === 'browse') goDetail()
    else if (stage === 'detail') {
      setChoice('confirm')
      setStage('confirm')
    } else if (stage === 'confirm') {
      if (choice === 'confirm') setStage('checkout')
      else {
        setStage('detail')
        setStatus(DETAIL_STATUS)
      }
    } else {
      setStage('browse')
      setStatus(DEFAULT_STATUS)
    }
  }, [stage, choice, goDetail])

  // Esc steps back toward the catalog
  const back = useCallback(() => {
    if (stage === 'detail') {
      setStage('browse')
      setStatus(DEFAULT_STATUS)
    } else if (stage === 'confirm' || stage === 'checkout') {
      setStage('detail')
      setStatus(DETAIL_STATUS)
    }
  }, [stage])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ctrl+C leaves the shop, like interrupting a program in a terminal.
      // Left alone if text is selected, so copying still works.
      if (e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'c') {
        if (window.getSelection()?.toString()) return
        e.preventDefault()
        navigate({ to: '/' })
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Enter') {
        e.preventDefault()
        if (!e.repeat) advance()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        back()
        return
      }

      const next = e.key === 'ArrowRight' || e.key === 'l'
      const prev = e.key === 'ArrowLeft' || e.key === 'h'
      if (stage === 'confirm') {
        if (next || prev || e.key === 'Tab') {
          e.preventDefault()
          setChoice((c) => (c === 'confirm' ? 'cancel' : 'confirm'))
        }
      } else if (stage === 'detail') {
        if (next) {
          e.preventDefault()
          selectView(viewIdx + 1)
        } else if (prev) {
          e.preventDefault()
          selectView(viewIdx - 1)
        }
      } else if (stage === 'browse') {
        if (next) {
          e.preventDefault()
          select(selected + 1)
        } else if (prev) {
          e.preventDefault()
          select(selected - 1)
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [stage, selected, viewIdx, select, selectView, advance, back, navigate])

  const inDetail = stage !== 'browse'
  const prevLabel = inDetail ? 'Previous view (←)' : 'Previous item (←)'
  const nextLabel = inDetail ? 'Next view (→)' : 'Next item (→)'
  const onPrev = () => (inDetail ? selectView(viewIdx - 1) : select(selected - 1))
  const onNext = () => (inDetail ? selectView(viewIdx + 1) : select(selected + 1))

  return (
    <div className="flex h-screen w-screen flex-col bg-black px-[11vw] py-[9vh] font-mono text-sm text-neutral-300">
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col text-center">
        <h1 className="m-0 text-sm font-bold tracking-widest" style={{ color: ACCENT }}>
          ◆ SHOP
        </h1>

        {/* Model or photo, with prev/next arrows */}
        <div className="mt-2 flex min-h-0 flex-1 items-stretch gap-2">
          <div className="flex items-center">
            <TuiButton onClick={onPrev} label={prevLabel} className="py-6 text-lg">
              ◀
            </TuiButton>
          </div>
          <div className="min-h-0 min-w-0 flex-1">
            {inDetail && view.kind === 'photo' ? (
              <img
                key={view.src}
                src={view.src}
                alt={`${product.name}, photo`}
                className="h-full w-full select-none object-contain"
                draggable={false}
              />
            ) : (
              <ModelViewport
                key={`${product.id}-${inDetail ? view.kind : 'shaded'}`}
                model={product.model}
                mode={inDetail && view.kind === 'wire' ? 'wire' : 'shaded'}
              />
            )}
          </div>
          <div className="flex items-center">
            <TuiButton onClick={onNext} label={nextLabel} className="py-6 text-lg">
              ▶
            </TuiButton>
          </div>
        </div>

        {/* Position dots (catalog) or view tabs (details) */}
        {inDetail ? (
          <nav aria-label="Views" className="mt-2 flex flex-wrap justify-center gap-1">
            {views.map((v, i) => (
              <TuiButton key={v.label} onClick={() => selectView(i)} active={i === viewIdx} label={`Show ${v.label}`}>
                {v.label}
              </TuiButton>
            ))}
          </nav>
        ) : (
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
        )}

        {/* Detail */}
        <section className="mt-3">
          <div className="flex flex-wrap items-baseline justify-center gap-x-3">
            <h2 className="m-0 text-base font-bold" style={{ color: ACCENT }}>
              {product.name}
            </h2>
            <span className="text-neutral-500">{product.tagline}</span>
          </div>
          <div className="mx-auto my-1 min-h-[3.6em] max-w-prose">
            {inDetail ? (
              <p className="m-0 text-neutral-300">{product.description}</p>
            ) : (
              <Typewriter key={product.id} text={product.description} />
            )}
          </div>
          {!inDetail && (
            <p className="m-0 text-xs text-neutral-500">
              {product.model.vertexCount} vertices · {product.model.faceCount} faces · .obj
            </p>
          )}
          <div className="mt-3 flex justify-center gap-4">
            {inDetail ? (
              <>
                <TuiButton onClick={advance} label="Buy (enter)">
                  [ buy ]
                </TuiButton>
                <TuiButton onClick={back} label="Back (esc)">
                  [ back ]
                </TuiButton>
              </>
            ) : (
              <>
                <TuiButton onClick={goDetail} label="See details (enter)">
                  [ see details ]
                </TuiButton>
                <Link to="/" className="no-underline" aria-label="Exit the shop">
                  <span className="inline-block cursor-pointer px-2 py-0.5 text-[#4ade80] transition-colors hover:bg-[#4ade80] hover:text-black">
                    [ exit ]
                  </span>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* Status bar */}
        <footer className="mt-3 min-h-[1.2em] text-xs text-neutral-500" aria-live="polite">
          {status}
        </footer>
      </div>

      {stage === 'confirm' && (
        <ConfirmDialog
          productName={product.name}
          choice={choice}
          onChoose={setChoice}
          onRun={(c) => {
            if (c === 'confirm') setStage('checkout')
            else back()
          }}
        />
      )}
      {stage === 'checkout' && (
        <CheckoutDialog
          productName={product.name}
          onDone={() => {
            setStage('browse')
            setStatus(DEFAULT_STATUS)
          }}
          onBack={back}
        />
      )}
    </div>
  )
}
