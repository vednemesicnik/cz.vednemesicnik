import { clsx } from 'clsx'
import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { ActionMenu } from '~/components/action-menu'

import { getEdgeScrollSpeed } from '~/utils/get-edge-scroll-speed'
import { moveListItem } from '~/utils/move-list-item'

import styles from './_styles.module.css'

type Item = {
  id: string
  title: string
  detail: string
}

type Props = {
  items: Item[]
  onReorder: (items: Item[]) => void
}

type Drag = {
  id: string
  pointerId: number
  startY: number
  offsetY: number
  isMoving: boolean
}

// A click on the row is not a drag until the pointer moves this far.
const DRAG_THRESHOLD_PX = 4

// Matches the list's gap in the stylesheet.
const ROW_GAP_PX = 6

// How far past the midpoint the pointer goes before a swap, either way.
const SWAP_HYSTERESIS_PX = 8

// Near the list's top or bottom edge a drag scrolls the list, faster the
// closer the pointer gets, up to this many pixels a frame.
const AUTOSCROLL_EDGE_PX = 40
const AUTOSCROLL_MAX_PX = 12

// How long a row slides into its new place after a swap.
const SWAP_MS = 150

const position = (index: number, count: number) =>
  `Pozice ${index + 1}, celkem ${count}.`

/**
 * The articles of a bulk publish in the order they will stand on the website
 * (design 22c): the number, a handle, the title with its state and a „⋯“. A
 * row is dragged as a whole; the handle is a button for the keyboard — Space
 * lifts and drops, the arrows move, Escape puts it back; the „⋯“ moves it with
 * a single click, no dragging (WCAG 2.5.7, 5mehib4t). A screen reader hears
 * every step (copy bhmem1jc, 8e0nd23z).
 *
 * @param props.items - The articles, top first.
 * @param props.onReorder - Receives the new order.
 */
export const ReorderableList = ({ items, onReorder }: Props) => {
  const instructionId = useId()
  const [drag, setDrag] = useState<Drag | null>(null)
  const [lifted, setLifted] = useState<{ id: string; from: number } | null>(
    null,
  )
  const [announcement, setAnnouncement] = useState('')
  // The row moved from its „⋯“, whose trigger keeps the focus.
  const [menuMovedId, setMenuMovedId] = useState<string | null>(null)
  const rowRefs = useRef(new Map<string, HTMLDivElement>())
  const handleRefs = useRef(new Map<string, HTMLButtonElement>())
  const slotRefs = useRef(new Map<string, HTMLLIElement>())
  const previousTops = useRef(new Map<string, number>())
  const draggedIdRef = useRef<string | null>(null)
  draggedIdRef.current = drag?.isMoving === true ? drag.id : null
  const listRef = useRef<HTMLOListElement>(null)
  const lastPointerYRef = useRef<number | null>(null)

  const count = items.length
  const indexOf = (id: string) => items.findIndex((item) => item.id === id)

  // A swap slides the rows into their new places instead of jumping, which
  // flickers (FLIP). The dragged row is held under the pointer by the inverse
  // movement added on top of its own offset.
  useLayoutEffect(() => {
    const isReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    for (const item of items) {
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
  }, [items])

  // A moved node can lose focus as React reorders the list; keep it on the handle.
  useEffect(() => {
    if (lifted === null) return
    const handle = handleRefs.current.get(lifted.id)
    if (handle !== undefined && document.activeElement !== handle) {
      handle.focus()
    }
  })

  // A moved row's „⋯“ keeps the focus, though React moved the row (5mehib4t).
  useEffect(() => {
    if (menuMovedId === null) return
    rowRefs.current
      .get(menuMovedId)
      ?.querySelector<HTMLButtonElement>('[popovertarget]')
      ?.focus()
    setMenuMovedId(null)
  }, [menuMovedId])

  const moveFromMenu = (id: string, target: number) => {
    onReorder(moveListItem(items, indexOf(id), target))
    setMenuMovedId(id)
    setAnnouncement(position(target, count))
  }

  // Only the steps that change something (22c).
  const getMenuItems = (id: string, index: number) => [
    ...(index > 0
      ? [
          {
            label: 'Posunout nahoru',
            onSelect: () => moveFromMenu(id, index - 1),
          },
        ]
      : []),
    ...(index < count - 1
      ? [
          {
            label: 'Posunout dolů',
            onSelect: () => moveFromMenu(id, index + 1),
          },
        ]
      : []),
    ...(index > 1
      ? [{ label: 'Na začátek', onSelect: () => moveFromMenu(id, 0) }]
      : []),
    ...(index < count - 2
      ? [{ label: 'Na konec', onSelect: () => moveFromMenu(id, count - 1) }]
      : []),
  ]

  const handlePointerDown = (
    event: PointerEvent<HTMLDivElement>,
    id: string,
  ) => {
    if (event.button !== 0 || lifted !== null) return
    // The „⋯“ and its menu are clicked, not dragged; capturing the pointer
    // would take their click.
    if (
      event.target instanceof Element &&
      event.target.closest('[data-reorder-menu]') !== null
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

    while (direction !== 0 && Math.sign(remaining) === direction) {
      const neighbour = items[target + direction]
      const neighbourRow =
        neighbour === undefined ? undefined : rowRefs.current.get(neighbour.id)

      // Past the midpoint of the step plus a band: a swap moves the row by
      // the whole step, so without the band it lands past the line back and
      // the slightest wiggle swaps it again.
      const step = neighbourRow?.offsetHeight ?? 0
      if (
        neighbourRow === undefined ||
        Math.abs(remaining) <= (step + ROW_GAP_PX) / 2 + SWAP_HYSTERESIS_PX
      ) {
        break
      }

      const shift = (step + ROW_GAP_PX) * direction
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

    if (target !== from) {
      onReorder(moveListItem(items, from, target))
    }

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
  // so a row can travel past what the list shows (a batch has 10–20 articles).
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
      const item = items[indexOf(drag.id)]
      setAnnouncement(
        `Přesunuto: ${item.title}. ${position(indexOf(drag.id), count)}`,
      )
    }
    setDrag(null)
  }

  const handleKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    id: string,
  ) => {
    const index = indexOf(id)
    const item = items[index]

    if (event.key === ' ') {
      event.preventDefault()

      if (lifted === null) {
        setLifted({ from: index, id })
        setAnnouncement(`Zvednuto: ${item.title}. ${position(index, count)}`)
      } else {
        setLifted(null)
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
      onReorder(moveListItem(items, index, target))
      setAnnouncement(position(target, count))
      return
    }

    if (event.key === 'Escape') {
      // Escape puts the row back and must not close the dialog.
      event.preventDefault()
      event.stopPropagation()
      onReorder(moveListItem(items, index, lifted.from))
      setLifted(null)
      setAnnouncement(`Přesun zrušen. ${position(lifted.from, count)}`)
    }
  }

  return (
    <>
      {/* The rows' buttons reach and scroll it; the scroll box itself is no stop. */}
      <ol className={styles.list} ref={listRef} tabIndex={-1}>
        {items.map((item, index) => {
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
            >
              <div
                className={clsx(styles.row, isLifted && styles.lifted)}
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
                <span aria-hidden={true} className={styles.number}>
                  {index + 1}
                </span>
                <button
                  aria-describedby={instructionId}
                  aria-label={`Přesunout článek: ${item.title}`}
                  aria-pressed={lifted?.id === item.id}
                  className={styles.handle}
                  onKeyDown={(event) => handleKeyDown(event, item.id)}
                  ref={(element) => {
                    if (element === null) handleRefs.current.delete(item.id)
                    else handleRefs.current.set(item.id, element)
                  }}
                  type={'button'}
                >
                  <svg
                    aria-hidden={true}
                    fill={'none'}
                    height={16}
                    stroke={'currentColor'}
                    strokeLinecap={'round'}
                    strokeLinejoin={'round'}
                    strokeWidth={2}
                    viewBox={'0 0 24 24'}
                    width={16}
                  >
                    <circle cx={9} cy={5} r={1} />
                    <circle cx={9} cy={12} r={1} />
                    <circle cx={9} cy={19} r={1} />
                    <circle cx={15} cy={5} r={1} />
                    <circle cx={15} cy={12} r={1} />
                    <circle cx={15} cy={19} r={1} />
                  </svg>
                </button>
                <span className={styles.text}>
                  <span className={styles.title}>{item.title}</span>
                  <span className={styles.detail}>{item.detail}</span>
                </span>
                <span className={styles.menu} data-reorder-menu={true}>
                  <ActionMenu
                    items={getMenuItems(item.id, index)}
                    label={`Změnit pořadí článku: ${item.title}`}
                    size={'sm'}
                  />
                </span>
              </div>
            </li>
          )
        })}
      </ol>
      <span className={'screen-reader-only'} id={instructionId}>
        Mezerníkem článek zvednete i položíte, šipkami nahoru a dolů posunete a
        klávesou Escape přesun zrušíte.
      </span>
      <span aria-live={'assertive'} className={'screen-reader-only'}>
        {announcement}
      </span>
    </>
  )
}
