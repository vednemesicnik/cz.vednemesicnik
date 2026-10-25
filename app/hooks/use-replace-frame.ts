import {
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from 'react'

type Options<Key> = {
  onRefocus: (key: Key) => void
}

type FrameProps = {
  onBlur?: (event: FocusEvent<HTMLElement>) => void
  onKeyDownCapture?: (event: KeyboardEvent<HTMLElement>) => void
  onMouseDown?: (event: MouseEvent<HTMLElement>) => void
}

/**
 * The frame that swaps an author row for an author search (design 24j
 * Vyměnit, 28f Změnit, ivyin4kr, nstqrn5g): which row is being replaced, the
 * search's query and ref, and the frame's handlers. The markup, the copy and
 * what a choice does stay with the caller.
 *
 * Esc and Zrušit (`stop({ refocus: true })`) end it and return the focus to
 * the row; leaving the frame (a click or Tab elsewhere) ends it and keeps the
 * focus where it went.
 *
 * @param options.onRefocus - Focuses the row's button once it is back after
 *   Zrušit or Esc; gets the key the replacing started with.
 * @returns `replacingKey`, the row being replaced or `null`; `start(key)`,
 *   which empties `query` and, once rendered, puts the focus in the search
 *   (`searchRef`); `stop({ refocus })`; `query` and `setQuery` for the
 *   search; and `frameProps` to spread on the frame, empty while nothing is
 *   being replaced.
 */
export const useReplaceFrame = <Key>({ onRefocus }: Options<Key>) => {
  const [replacingKey, setReplacingKey] = useState<Key | null>(null)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  // The key to refocus once the row is back: set by Zrušit and Esc only.
  const refocusKeyRef = useRef<Key | null>(null)

  const start = (key: Key) => {
    setQuery('')
    setReplacingKey(key)
  }
  const stop = ({ refocus }: { refocus: boolean }) => {
    refocusKeyRef.current = refocus ? replacingKey : null
    setReplacingKey(null)
  }

  // After the commit: into the search when replacing starts, back to the
  // row's button when Zrušit or Esc ended it.
  const handleReplacingChange = useEffectEvent((isReplacing: boolean) => {
    if (isReplacing) {
      searchRef.current?.focus()
      return
    }
    const key = refocusKeyRef.current
    if (key === null) return
    refocusKeyRef.current = null
    onRefocus(key)
  })
  useEffect(() => {
    handleReplacingChange(replacingKey !== null)
  }, [replacingKey])

  // Esc cancels at once, the open list included, and goes no further: on a
  // phone it would also close the Autoři panel (24f).
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') return
    event.preventDefault()
    event.stopPropagation()
    stop({ refocus: true })
  }
  const handleBlur = (event: FocusEvent<HTMLElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      stop({ refocus: false })
    }
  }
  // A press anywhere in the frame but the field keeps the focus in the field:
  // a click that does not focus (Zrušit in Safari, the name) is no leaving.
  const handleMouseDown = (event: MouseEvent<HTMLElement>) => {
    if (!(event.target instanceof Element && event.target.closest('input'))) {
      event.preventDefault()
    }
  }

  const frameProps: FrameProps =
    replacingKey === null
      ? {}
      : {
          onBlur: handleBlur,
          onKeyDownCapture: handleKeyDown,
          onMouseDown: handleMouseDown,
        }

  return {
    frameProps,
    query,
    replacingKey,
    searchRef,
    setQuery,
    start,
    stop,
  }
}
