import { clsx } from 'clsx'
import {
  createContext,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { getEdgeScrollSpeed } from '~/utils/get-edge-scroll-speed'
import { moveListItem } from '~/utils/move-list-item'

import styles from './_styles.module.css'

type Row<Item> = {
  item: Item
  index: number
  count: number
  /** Lifted by the keyboard or dragged by the pointer. */
  isLifted: boolean
  /** Moves the row with a single action, no dragging (WCAG 2.5.7). */
  moveTo: (target: number) => void
}

type Props<Item extends { id: string }> = {
  items: Item[]
  /** Receives the one move a drag, a drop or `moveTo` made. */
  onReorder: (from: number, to: number) => void
  /** The item's name in the announcements; „Zvednuto: {name}. …“. */
  getName: (item: Item) => string
  /** How the handle is used, read by a screen reader with every handle. */
  instruction: string
  /** Where a pointer drag starts: the whole row, or only its handle. */
  dragArea?: 'row' | 'handle'
  className?: string
  rowClassName?: string
  children: (row: Row<Item>) => ReactNode
}

type Drag = {
  id: string
  pointerId: number
  startY: number
  offsetY: number
  isMoving: boolean
}

type RowContextValue = {
  isLifted: boolean
  instructionId: string
  onBlur: (event: FocusEvent<HTMLButtonElement>) => void
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => void
  setHandle: (element: HTMLButtonElement | null) => void
}

const RowContext = createContext<RowContextValue | undefined>(undefined)

// A click on the row is not a drag until the pointer moves this far.
const DRAG_THRESHOLD_PX = 4

// How far past the midpoint the pointer goes before a swap, either way.
const SWAP_HYSTERESIS_PX = 8

// Near the list's top or bottom edge a drag scrolls the list, faster the
// closer the pointer gets, up to this many pixels a frame.
const AUTOSCROLL_EDGE_PX = 40
const AUTOSCROLL_MAX_PX = 12

// How long a row slides into its new place after a swap.
const SWAP_MS = 150

// A press here clicks or types; only the handle drags from a control.
const CONTROL_SELECTOR =
  'a, button:not([data-reorder-handle]), input, select, textarea, [contenteditable], [popover]'

const position = (index: number, count: number) =>
  `Pozice ${index + 1}, celkem ${count}.`

/**
 * A list whose rows change order (design 22c, 27d): dragged by the pointer,
 * or from the {@link ReorderableListHandle} by the keyboard — Space lifts and
 * drops, the arrows move, Escape puts the row back. A screen reader hears
 * every step (copy bhmem1jc, 8e0nd23z, ahizoh4o). The row's content is the
 * caller's; while a row moves, the list keeps the order itself and reports
 * the one move when the row lands.
 *
 * @param props.items - The rows, top first, each with a stable `id`.
 * @param props.dragArea - `'handle'` for rows that hold fields, so a press in
 *   a field types and the page still scrolls under a finger.
 * @param props.children - Renders a row's content, with its handle.
 */
export const ReorderableList = <Item extends { id: string }>({
  items,
  onReorder,
  getName,
  instruction,
  dragArea = 'row',
  className,
  rowClassName,
  children,
}: Props<Item>) => {
  const instructionId = useId()
  const [drag, setDrag] = useState<Drag | null>(null)
  const [lifted, setLifted] = useState<{ id: string; from: number } | null>(
    null,
  )
  // The order while a row moves; the caller's once it lands.
  const [movingOrder, setMovingOrder] = useState<string[] | null>(null)
  const [announcement, setAnnouncement] = useState('')
  // The control a single-action move came from keeps the focus.
  const [refocused, setRefocused] = useState<HTMLElement | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const handleRefs = useRef(new Map<string, HTMLButtonElement>())
  const slotRefs = useRef(new Map<string, HTMLLIElement>())
  const previousTops = useRef(new Map<string, number>())
  const draggedIdRef = useRef<string | null>(null)
  draggedIdRef.current = drag?.isMoving === true ? drag.id : null
  const listRef = useRef<HTMLOListElement>(null)
  const lastPointerYRef = useRef<number | null>(null)

  const itemById = new Map(items.map((item) => [item.id, item]))
  const shownItems =
    movingOrder === null
      ? items
      : movingOrder.flatMap((id) => {
          const item = itemById.get(id)
          return item === undefined ? [] : [item]
        })
  const count = shownItems.length
  const indexOf = (id: string) => shownItems.findIndex((item) => item.id === id)
  const shownOrder = shownItems.map((item) => item.id).join(' ')

  const moveShown = (from: number, to: number) =>
    setMovingOrder(moveListItem(shownItems, from, to).map((item) => item.id))

  // Lands the moving row: the caller gets the one move it made.
  const land = (id: string) => {
    const from = items.findIndex((item) => item.id === id)
    const to = indexOf(id)
    setMovingOrder(null)
    if (from !== -1 && from !== to) onReorder(from, to)
  }

  // A swap slides the rows into their new places instead of jumping, which
  // flickers (FLIP). The dragged row is held under the pointer by the inverse
  // movement added on top of its own offset.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the order changes
  useLayoutEffect(() => {
    const isReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    for (const item of shownItems) {
      const slot = slotRefs.current.get(item.id)
      if (slot === undefined) continue

      const top = slot.offsetTop
      const previousTop = previousTops.current.get(item.id)
      previousTops.current.set(item.id, top)

      if (isReduced || previousTop === undefined || previousTop === top) {
        continue
      }

      const delta = previousTop - top
      const timing = { duration: SWAP_MS, easing: 'ease-out' }
      slot.animate(
        [{ transform: `translateY(${delta}px)` }, { transform: 'none' }],
        timing,
      )

      if (item.id === draggedIdRef.current) {
        rowRefs.current
          .get(item.id)
          ?.animate(
            [
              { transform: `translateY(${-delta}px)` },
              { transform: 'translateY(0)' },
            ],
            { ...timing, composite: 'add' },
          )
      }
    }
  }, [shownOrder])

  // A moved node can lose focus as React reorders the list; keep it on the
  // handle while the row moves, not on every render of the page around it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the row moves
  useEffect(() => {
    if (lifted === null) return
    const handle = handleRefs.current.get(lifted.id)
    if (handle !== undefined && document.activeElement !== handle) {
      handle.focus()
    }
  }, [lifted, shownOrder])

  // A single-action move keeps the focus on its control, though React moved
  // the row (5mehib4t).
  useEffect(() => {
    if (refocused === null) return
    refocused.focus()
    setRefocused(null)
  }, [refocused])

  const moveWithoutDragging = (id: string, target: number) => {
    // While a row moves, positions are the list's own, not the caller's.
    if (movingOrder !== null) return
    const from = indexOf(id)
    if (from === -1) return
    const focused = document.activeElement
    onReorder(from, Math.max(0, Math.min(count - 1, target)))
    if (focused instanceof HTMLElement) setRefocused(focused)
    setAnnouncement(position(Math.max(0, Math.min(count - 1, target)), count))
  }

  const handlePointerDown = (
    event: PointerEvent<HTMLDivElement>,
    id: string,
  ) => {
    if (event.button !== 0 || lifted !== null) return
    if (!(event.target instanceof Element)) return
    // A disabled handle locks its row, also against the pointer: a disabled
    // control still gets the press.
    if (
      event.currentTarget.querySelector<HTMLButtonElement>(
        '[data-reorder-handle]',
      )?.disabled
    ) {
      return
    }
    // A control in the row is clicked or typed in; capturing the pointer
    // would take its click.
    if (event.target.closest(CONTROL_SELECTOR) !== null) return
    if (
      dragArea === 'handle' &&
      event.target.closest('[data-reorder-handle]') === null
    ) {
      return
    }
    event.currentTarget.setPointerCapture(event.pointerId)
    setDrag({
      id,
      isMoving: false,
      offsetY: 0,
      pointerId: event.pointerId,
      startY: event.clientY,
    })
  }

  // Moves the dragged row to follow the pointer. `scrolledBy` is how far the
  // list just scrolled under a still pointer, which shifts every row with it.
  const moveTo = (clientY: number, scrolledBy = 0) => {
    if (drag === null) return

    const offsetY = clientY - (drag.startY - scrolledBy)
    if (!drag.isMoving && Math.abs(offsetY) < DRAG_THRESHOLD_PX) return

    // The row swaps with each neighbour whose middle the pointer has passed,
    // as many as one fast move crossed.
    const from = indexOf(drag.id)
    let target = from
    let remaining = offsetY
    let startY = drag.startY - scrolledBy
    // One direction per move: a leftover past the last swap never turns back.
    const direction = Math.sign(offsetY)
    // The gap as rendered: a caller may set its own (27d).
    const rowGap =
      listRef.current === null
        ? 0
        : Number.parseFloat(getComputedStyle(listRef.current).rowGap) || 0

    while (direction !== 0 && Math.sign(remaining) === direction) {
      const neighbour = shownItems[target + direction]
      const neighbourRow =
        neighbour === undefined ? undefined : rowRefs.current.get(neighbour.id)

      // Past the midpoint of the step plus a band: a swap moves the row by
      // the whole step, so without the band it lands past the line back and
      // the slightest wiggle swaps it again.
      const step = neighbourRow?.offsetHeight ?? 0
      if (
        neighbourRow === undefined ||
        Math.abs(remaining) <= (step + rowGap) / 2 + SWAP_HYSTERESIS_PX
      ) {
        break
      }

      const shift = (step + rowGap) * direction
      target += direction
      remaining -= shift
      startY += shift
    }

    // The first row stops at the top, the last at the bottom: like the fixed
    // sideways shift, the lifted row never leaves the list.
    const clampedOffsetY =
      target === 0 && remaining < 0
        ? 0
        : target === count - 1 && remaining > 0
          ? 0
          : remaining

    if (target !== from) moveShown(from, target)

    setDrag({ ...drag, isMoving: true, offsetY: clampedOffsetY, startY })
  }
  const moveToRef = useRef(moveTo)
  moveToRef.current = moveTo

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag === null || event.pointerId !== drag.pointerId) return
    lastPointerYRef.current = event.clientY
    moveTo(event.clientY)
  }

  // While a row is dragged near the list's edge, the list scrolls by itself,
  // so a row can travel past what the list shows.
  useEffect(() => {
    if (drag?.isMoving !== true) return

    let frame = 0
    const tick = () => {
      const list = listRef.current
      const pointerY = lastPointerYRef.current

      if (list !== null && pointerY !== null) {
        const box = list.getBoundingClientRect()
        const speed = getEdgeScrollSpeed({
          edge: AUTOSCROLL_EDGE_PX,
          end: box.bottom,
          max: AUTOSCROLL_MAX_PX,
          pointer: pointerY,
          start: box.top,
        })

        if (speed !== 0) {
          const before = list.scrollTop
          list.scrollTop += speed
          const scrolledBy = list.scrollTop - before
          if (scrolledBy !== 0) moveToRef.current(pointerY, scrolledBy)
        }
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [drag?.isMoving])

  const handlePointerEnd = () => {
    if (drag === null) return

    lastPointerYRef.current = null
    if (drag.isMoving) {
      const index = indexOf(drag.id)
      setAnnouncement(
        `Přesunuto: ${getName(shownItems[index])}. ${position(index, count)}`,
      )
      land(drag.id)
    }
    setDrag(null)
  }

  // Leaving the handle puts a lifted row down where it is: the focus is
  // elsewhere, and so is the next key.
  const handleHandleBlur = (
    event: FocusEvent<HTMLButtonElement>,
    id: string,
  ) => {
    if (lifted?.id !== id) return
    // React moving the row blurs it too; the focus comes back to it.
    if (event.relatedTarget === null && document.hasFocus()) return
    setLifted(null)
    land(id)
    setAnnouncement(`Položeno. ${position(indexOf(id), count)}`)
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    id: string,
  ) => {
    const index = indexOf(id)
    const item = shownItems[index]

    if (event.key === ' ') {
      event.preventDefault()

      if (lifted === null) {
        setLifted({ from: index, id })
        setMovingOrder(shownItems.map((shown) => shown.id))
        setAnnouncement(`Zvednuto: ${getName(item)}. ${position(index, count)}`)
      } else {
        setLifted(null)
        land(id)
        setAnnouncement(`Položeno. ${position(index, count)}`)
      }
      return
    }

    if (lifted === null) return

    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      const target = Math.max(
        0,
        Math.min(count - 1, index + (event.key === 'ArrowUp' ? -1 : 1)),
      )
      moveShown(index, target)
      setAnnouncement(position(target, count))
      return
    }

    if (event.key === 'Escape') {
      // Escape puts the row back and must not close a dialog around it.
      event.preventDefault()
      event.stopPropagation()
      setMovingOrder(null)
      setLifted(null)
      setAnnouncement(`Přesun zrušen. ${position(lifted.from, count)}`)
    }
  }

  return (
    <>
      {/* The rows' controls reach and scroll it; the list itself is no stop.
          The rows keep the caller's order in the DOM while one moves, and
          stand in the moving order by `order`: a moved node would lose the
          pointer's capture and the focus. */}
      <ol className={clsx(styles.list, className)} ref={listRef} tabIndex={-1}>
        {items.map((item) => {
          const index = indexOf(item.id)
          const isDragged = drag?.id === item.id && drag.isMoving
          const isLifted = isDragged || lifted?.id === item.id

          return (
            <li
              className={clsx(styles.slot, isLifted && styles.landing)}
              key={item.id}
              ref={(element) => {
                if (element === null) slotRefs.current.delete(item.id)
                else slotRefs.current.set(item.id, element)
              }}
              style={{ order: index }}
            >
              <div
                className={clsx(
                  styles.row,
                  dragArea === 'row' && styles.isRowDragged,
                  isLifted && styles.lifted,
                  rowClassName,
                )}
                // For a row's own look of the lift, e.g. its border.
                data-lifted={isLifted || undefined}
                onLostPointerCapture={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onPointerDown={(event) => handlePointerDown(event, item.id)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                ref={(element) => {
                  if (element === null) rowRefs.current.delete(item.id)
                  else rowRefs.current.set(item.id, element)
                }}
                style={
                  isDragged
                    ? { transform: `translate(8px, ${drag.offsetY}px)` }
                    : undefined
                }
              >
                <RowContext.Provider
                  value={{
                    instructionId,
                    isLifted: lifted?.id === item.id,
                    onBlur: (event) => handleHandleBlur(event, item.id),
                    onKeyDown: (event) => handleKeyDown(event, item.id),
                    setHandle: (element) => {
                      if (element === null) handleRefs.current.delete(item.id)
                      else handleRefs.current.set(item.id, element)
                    },
                  }}
                >
                  {children({
                    count,
                    index,
                    isLifted,
                    item,
                    moveTo: (target) => moveWithoutDragging(item.id, target),
                  })}
                </RowContext.Provider>
              </div>
            </li>
          )
        })}
      </ol>
      <span className={'screen-reader-only'} id={instructionId}>
        {instruction}
      </span>
      <span aria-live={'assertive'} className={'screen-reader-only'}>
        {announcement}
      </span>
    </>
  )
}

/**
 * What a row of the list shares with its handle: the keyboard, the
 * instruction and whether the row is lifted.
 *
 * @returns The row's context.
 */
export const useReorderableListRow = () => {
  const context = useContext(RowContext)

  if (context === undefined) {
    throw new Error(
      'useReorderableListRow must be used within a ReorderableList row',
    )
  }

  return context
}
