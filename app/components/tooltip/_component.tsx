import { clsx } from 'clsx'
import {
  type CSSProperties,
  type FocusEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  type ToggleEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import { getTooltipDelay } from '~/utils/get-tooltip-delay'

import styles from './_styles.module.css'

// Shared by every tooltip: the next one shows at once within 300 ms.
let lastHiddenAt = 0

type Props = {
  /** Equals the trigger's accessible name (`aria-label` or its text). */
  label: string
  children: ReactNode
  placement?: 'top' | 'bottom'
  /** Shows only while this element's text is cut off, e.g. a long name. */
  truncatedRef?: RefObject<HTMLElement | null>
  className?: string
}

const isCutOff = (element: HTMLElement | null) =>
  element !== null && element.scrollWidth > element.clientWidth

/**
 * The design system's `Tooltip` (jb81di02): the name of an action that has
 * none on screen — an icon-only button, or an item whose text is cut off. Its
 * text repeats the trigger's accessible name, so the bubble is `aria-hidden`.
 * Never instead of a name that fits, never the only carrier of information
 * (touch never shows it) and never for a state.
 *
 * The mouse shows it after 500 ms (at once when moving on from another one),
 * keyboard focus at once, touch never; Esc, leaving, pressing and blur hide it.
 * The bubble sits in the top layer, anchored to the trigger, so no scrolling
 * row or menu clips it; without anchor positioning it stays hidden.
 *
 * @param props.label - The text, the same as the trigger's accessible name.
 * @param props.placement - `top` by default; it flips when there is no room.
 * @param props.truncatedRef - For an item that shows its name: the element
 *   whose text may be cut off; the tooltip shows only while it is.
 * @param props.className - For the anchor wrapper, e.g. to let it grow in a
 *   flex row.
 */
export const Tooltip = ({
  label,
  children,
  placement = 'top',
  truncatedRef,
  className,
}: Props) => {
  const bubbleRef = useRef<HTMLSpanElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [isOpen, setIsOpen] = useState(false)
  // An id from useId() carries characters a dashed ident may not.
  const anchorName = `--tooltip-${useId().replace(/[^\w-]/g, '')}`

  const show = () => {
    if (truncatedRef !== undefined && !isCutOff(truncatedRef.current)) return

    bubbleRef.current?.showPopover?.()
  }

  const hide = () => {
    clearTimeout(timeoutRef.current)

    if (bubbleRef.current?.matches(':popover-open')) {
      bubbleRef.current.hidePopover()
    }
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  // `popover="hint"` closes on Esc by itself; where it falls back to `manual`
  // (Safari) it does not.
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hide()
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => document.removeEventListener('keydown', handleKeyDown)
  })

  const handlePointerEnter = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(
      show,
      getTooltipDelay(Date.now(), lastHiddenAt),
    )
  }

  const handleFocus = (event: FocusEvent) => {
    if (!event.target.matches(':focus-visible')) return

    clearTimeout(timeoutRef.current)
    show()
  }

  // `beforetoggle` fires inside hidePopover() and on a native close, so the
  // next trigger, entered in the same pointer move, already sees the time.
  const handleBeforeToggle = (event: ToggleEvent<HTMLSpanElement>) => {
    if (event.newState === 'closed') lastHiddenAt = Date.now()
  }

  const handleToggle = (event: ToggleEvent<HTMLSpanElement>) => {
    setIsOpen(event.newState === 'open')
  }

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: listens to its trigger's pointer, focus and click, which bubble here; the trigger is the control
    // biome-ignore lint/a11y/useKeyWithClickEvents: the click only hides the bubble; the trigger owns the keys, and its keyboard press arrives as this click
    <span
      className={clsx(styles.anchor, className)}
      onBlur={hide}
      onClick={hide}
      onFocus={handleFocus}
      onPointerDown={hide}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={hide}
      style={{ '--tooltip-anchor': anchorName } as CSSProperties}
    >
      {children}
      <span
        aria-hidden={true}
        className={clsx(styles.bubble, placement === 'bottom' && styles.bottom)}
        onBeforeToggle={handleBeforeToggle}
        onToggle={handleToggle}
        popover={'hint'}
        ref={bubbleRef}
      >
        {label}
      </span>
    </span>
  )
}
