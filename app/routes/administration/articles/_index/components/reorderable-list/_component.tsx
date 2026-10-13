import { clsx } from 'clsx'
import {
  type KeyboardEvent,
  type PointerEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react'

import { ActionMenu } from '~/components/action-menu'

import { moveListItem } from '../../utils/move-list-item'

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

  const count = items.length
  const indexOf = (id: string) => items.findIndex((item) => item.id === id)

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

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (drag === null || event.pointerId !== drag.pointerId) return

    const offsetY = event.clientY - drag.startY
    if (!drag.isMoving && Math.abs(offsetY) < DRAG_THRESHOLD_PX) return

    // The row swaps with each neighbour whose middle the pointer has passed,
    // as many as one fast move crossed.
    const from = indexOf(drag.id)
    let target = from
    let remaining = offsetY
    let startY = drag.startY
    // One direction per move: a leftover past the last swap never turns back.
    const direction = Math.sign(offsetY)

    while (direction !== 0 && Math.sign(remaining) === direction) {
      const neighbour = items[target + direction]
      const neighbourRow =
        neighbour === undefined ? undefined : rowRefs.current.get(neighbour.id)

      if (
        neighbourRow === undefined ||
        Math.abs(remaining) <= neighbourRow.offsetHeight / 2
      ) {
        break
      }

      const shift = (neighbourRow.offsetHeight + ROW_GAP_PX) * direction
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

  const handlePointerEnd = () => {
    if (drag === null) return

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
      <ol className={styles.list}>
        {items.map((item, index) => {
          const isDragged = drag?.id === item.id && drag.isMoving
          const isLifted = isDragged || lifted?.id === item.id

          return (
            <li
              className={clsx(styles.slot, isLifted && styles.landing)}
              key={item.id}
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
