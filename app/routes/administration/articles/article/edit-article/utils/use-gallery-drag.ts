import {
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { getEdgeScrollSpeed } from '~/utils/get-edge-scroll-speed'
import { moveListItem } from '~/utils/move-list-item'

import { findTileAtPoint } from './find-tile-at-point'
import { getDraggedTileOffset } from './get-dragged-tile-offset'
import { getStoredMoveIndexes } from './get-stored-move-indexes'

type Point = { x: number; y: number }

type Options = {
  /** Every tile, in the gallery's order. */
  ids: string[]
  /** The stored images among them: only they move, and only past each other. */
  storedIds: string[]
  /** Whether a tile can be lifted now: a stored image with its „⋯“. */
  canDrag: (id: string) => boolean
  /** A tile that keeps its place, so none lands on it (the main image). */
  isPinned: (id: string) => boolean
  /** The part of a tile that is taken hold of: its preview. */
  handleSelector: string
  /** A tile was dropped at another place among the stored images. */
  onDrop: (id: string, to: number) => void
}

type Gesture = {
  id: string
  pointerId: number
  pointerType: string
  start: Point
  /** Where the pointer took hold of the tile, from the tile's corner. */
  grab: Point
  isLifted: boolean
  longPressTimer: number | undefined
}

/** The lifted tile and its place among the stored images, as shown. */
type Drag = { id: string; to: number }

// A mouse or pen lifts a tile once it moves this far, so a click stays one.
const DRAG_THRESHOLD_PX = 4

// A finger lifts a tile after holding it this long; moving further first
// scrolls the panel instead.
const LONG_PRESS_MS = 300
const LONG_PRESS_TOLERANCE_PX = 8

// Near the panel's top or bottom edge a drag scrolls it, faster the closer
// the pointer gets. The band is deeper than the panel's sticky bar.
const AUTOSCROLL_EDGE_PX = 96
const AUTOSCROLL_MAX_PX = 16

// How long a tile slides into its new place.
const SWAP_MS = 150

// Controls in a tile keep their own click, focus and text selection.
const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, [contenteditable], [popovertarget]'

// A tile's place in the grid as laid out, in the viewport's coordinates.
// Offsets leave out the transforms of a tile that is sliding or lifted.
const getSlotBox = (tile: HTMLElement) => {
  const grid = tile.parentElement
  const gridBox = grid?.getBoundingClientRect()
  return {
    height: tile.offsetHeight,
    left: (gridBox?.left ?? 0) + tile.offsetLeft - (grid?.offsetLeft ?? 0),
    top: (gridBox?.top ?? 0) + tile.offsetTop - (grid?.offsetTop ?? 0),
    width: tile.offsetWidth,
  }
}

/**
 * Dragging the gallery's stored images into another order (design 24b): a
 * mouse or pen takes hold of a tile's preview and moves, a finger holds it
 * first (a swipe still scrolls the panel). The tile follows the pointer, its
 * place stays marked, and it takes the place of each stored image it is moved
 * over; the others slide aside, a tile still processing or failed keeps its
 * own. The form's list moves once, on the drop. Escape puts the tile back.
 * The „⋯“ moves a tile without dragging (WCAG 2.5.7).
 *
 * @param options - The tiles, the stored images, which tile can be lifted,
 *   its preview's selector, and what to do with a drop.
 * @returns The lifted tile, the tiles in the order shown (for their numbers),
 *   each tile's CSS `order` while one is lifted, and the props of each
 *   tile's `<li>`.
 */
export const useGalleryDrag = ({
  ids,
  storedIds,
  canDrag,
  isPinned,
  handleSelector,
  onDrop,
}: Options) => {
  const [drag, setDrag] = useState<Drag | null>(null)
  // The drag as committed, which the layout read in a handler matches.
  const dragRef = useRef<Drag | null>(null)
  const gestureRef = useRef<Gesture | null>(null)
  const pointerRef = useRef<Point | null>(null)
  const tileRefs = useRef(new Map<string, HTMLLIElement>())
  const previousPositions = useRef(new Map<string, Point>())
  const swappedIdRef = useRef<string | null>(null)
  // Where the dropped tile was drawn, to settle from into its place.
  const settleRef = useRef<{ id: string; left: number; top: number } | null>(
    null,
  )
  // A finger's lifted tile moves instead of the panel scrolling. On every
  // tile all along, not only once lifted: Safari decides at the touch's
  // start whether a listener may stop the scroll.
  const preventLiftedScroll = useRef((event: TouchEvent) => {
    if (gestureRef.current?.isLifted) event.preventDefault()
  }).current
  const optionsRef = useRef({
    canDrag,
    handleSelector,
    isPinned,
    onDrop,
    storedIds,
  })
  optionsRef.current = { canDrag, handleSelector, isPinned, onDrop, storedIds }

  const indexes =
    drag === null
      ? null
      : getStoredMoveIndexes(ids, storedIds, drag.id, drag.to)
  const shownIds =
    drag === null
      ? null
      : indexes === null
        ? ids
        : moveListItem(ids, indexes.from, indexes.to)

  // Keeps the lifted tile under the pointer, inside the grid.
  const positionLifted = () => {
    const current = dragRef.current
    const pointer = pointerRef.current
    const gesture = gestureRef.current
    if (current === null || pointer === null || gesture === null) return

    const tile = tileRefs.current.get(current.id)
    const grid = tile?.parentElement
    if (tile === undefined || grid == null) return

    const offset = getDraggedTileOffset({
      bounds: grid.getBoundingClientRect(),
      grab: gesture.grab,
      pointer,
      slot: getSlotBox(tile),
    })
    tile.style.setProperty('--drag-x', `${offset.x}px`)
    tile.style.setProperty('--drag-y', `${offset.y}px`)
  }

  // The lifted tile takes the place of the stored image under the pointer.
  const updateTarget = () => {
    const current = dragRef.current
    const pointer = pointerRef.current
    const grid = tileRefs.current.get(current?.id ?? '')?.parentElement
    if (current === null || pointer === null || grid == null) return

    const { storedIds: currentStoredIds } = optionsRef.current
    const shownStoredIds = moveListItem(
      currentStoredIds,
      currentStoredIds.indexOf(current.id),
      current.to,
    )
    const candidates = shownStoredIds.flatMap((id) => {
      const tile = tileRefs.current.get(id)
      return id === current.id ||
        tile === undefined ||
        optionsRef.current.isPinned(id)
        ? []
        : [{ box: getSlotBox(tile), id }]
    })
    // A pointer past the grid's edge (over the panel's bar, say) counts as
    // at the edge, so the first and last places stay in reach.
    const gridBox = grid.getBoundingClientRect()
    const overId = findTileAtPoint(
      candidates,
      Math.max(gridBox.left, Math.min(pointer.x, gridBox.right - 1)),
      Math.max(gridBox.top, Math.min(pointer.y, gridBox.bottom - 1)),
    )
    // The tile just swapped with stays out of play until the pointer leaves
    // it: a taller one still under the pointer would swap straight back.
    if (overId === swappedIdRef.current) return
    swappedIdRef.current = null
    if (overId === null) return

    const to = shownStoredIds.indexOf(overId)
    if (to === current.to) return
    swappedIdRef.current = overId
    setDrag({ id: current.id, to })
  }

  const lift = () => {
    const gesture = gestureRef.current
    if (gesture === null) return

    const from = optionsRef.current.storedIds.indexOf(gesture.id)
    if (from === -1) {
      gestureRef.current = null
      return
    }

    gesture.isLifted = true
    swappedIdRef.current = null
    setDrag({ id: gesture.id, to: from })
  }

  // Ends the gesture; a committed drop at another place goes to the form.
  const finish = (isCommitted: boolean) => {
    const gesture = gestureRef.current
    if (gesture === null) return

    window.clearTimeout(gesture.longPressTimer)
    gestureRef.current = null
    pointerRef.current = null

    const tile = tileRefs.current.get(gesture.id)
    if (tile?.hasPointerCapture(gesture.pointerId)) {
      tile.releasePointerCapture(gesture.pointerId)
    }

    const current = dragRef.current
    if (current !== null && tile !== undefined) {
      const slot = getSlotBox(tile)
      settleRef.current = {
        id: current.id,
        left:
          slot.left +
          Number.parseFloat(tile.style.getPropertyValue('--drag-x') || '0'),
        top:
          slot.top +
          Number.parseFloat(tile.style.getPropertyValue('--drag-y') || '0'),
      }
    }
    // Cleared first: the form's list moves at once, in the same render.
    setDrag(null)
    if (!isCommitted || current === null || current.id !== gesture.id) return

    const { onDrop: drop, storedIds: currentStoredIds } = optionsRef.current
    if (current.to !== currentStoredIds.indexOf(current.id)) {
      drop(current.id, current.to)
    }
  }
  const finishRef = useRef(finish)
  finishRef.current = finish
  const scrollStepRef = useRef(() => {})
  scrollStepRef.current = () => {
    positionLifted()
    updateTarget()
  }

  const handlePointerDown = (
    event: PointerEvent<HTMLLIElement>,
    id: string,
  ) => {
    if (event.button !== 0 || gestureRef.current !== null) return

    const { target } = event
    if (
      !(target instanceof Element) ||
      target.closest(optionsRef.current.handleSelector) === null ||
      target.closest(INTERACTIVE_SELECTOR) !== null ||
      !optionsRef.current.canDrag(id)
    ) {
      return
    }

    const tile = event.currentTarget
    const slot = getSlotBox(tile)
    const gesture: Gesture = {
      grab: { x: event.clientX - slot.left, y: event.clientY - slot.top },
      id,
      isLifted: false,
      longPressTimer: undefined,
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      start: { x: event.clientX, y: event.clientY },
    }
    gestureRef.current = gesture
    pointerRef.current = { x: event.clientX, y: event.clientY }
    // Taken at once, a finger's too: its own capture to the element under
    // it would otherwise move later and end the gesture. A swipe still pans.
    tile.setPointerCapture(event.pointerId)

    if (event.pointerType === 'touch') {
      gesture.longPressTimer = window.setTimeout(lift, LONG_PRESS_MS)
    }
  }

  const handlePointerMove = (event: PointerEvent<HTMLLIElement>) => {
    const gesture = gestureRef.current
    if (gesture === null || event.pointerId !== gesture.pointerId) return

    pointerRef.current = { x: event.clientX, y: event.clientY }

    if (!gesture.isLifted) {
      const distance = Math.hypot(
        event.clientX - gesture.start.x,
        event.clientY - gesture.start.y,
      )
      if (gesture.pointerType === 'touch') {
        if (distance > LONG_PRESS_TOLERANCE_PX) finish(false)
      } else if (distance >= DRAG_THRESHOLD_PX) {
        lift()
      }
      return
    }

    positionLifted()
    updateTarget()
  }

  const handlePointerEnd = (
    event: PointerEvent<HTMLLIElement>,
    isCommitted: boolean,
  ) => {
    if (event.pointerId === gestureRef.current?.pointerId) finish(isCommitted)
  }

  // After each step: the other tiles slide from where they stood (FLIP), and
  // the lifted tile stays under the pointer in its new place. A dropped tile
  // settles from where it was drawn.
  useLayoutEffect(() => {
    dragRef.current = drag
    const isReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (drag === null) {
      previousPositions.current.clear()
      for (const tile of tileRefs.current.values()) {
        tile.style.removeProperty('--drag-x')
        tile.style.removeProperty('--drag-y')
      }

      const settle = settleRef.current
      settleRef.current = null
      const tile = settle === null ? undefined : tileRefs.current.get(settle.id)
      if (settle === null || tile === undefined || isReduced) return

      const slot = getSlotBox(tile)
      tile.animate(
        [
          {
            transform: `translate(${settle.left - slot.left}px, ${settle.top - slot.top}px)`,
          },
          { transform: 'none' },
        ],
        { duration: SWAP_MS, easing: 'ease-out' },
      )
      return
    }

    for (const [id, tile] of tileRefs.current) {
      const position = { x: tile.offsetLeft, y: tile.offsetTop }
      const previous = previousPositions.current.get(id)
      previousPositions.current.set(id, position)

      if (isReduced || id === drag.id || previous === undefined) continue

      const deltaX = previous.x - position.x
      const deltaY = previous.y - position.y
      if (deltaX === 0 && deltaY === 0) continue

      tile.animate(
        [
          { transform: `translate(${deltaX}px, ${deltaY}px)` },
          { transform: 'none' },
        ],
        { duration: SWAP_MS, easing: 'ease-out' },
      )
    }

    positionLifted()
  })

  // A lifted tile that can no longer move (removed, its hold lost) drops
  // back into its place.
  useEffect(() => {
    if (drag !== null && !canDrag(drag.id)) finishRef.current(false)
  })

  const isDragging = drag !== null

  // Near the panel's edge it scrolls by itself, so a tile can travel past
  // what the panel shows (one column on a phone, 24f).
  useEffect(() => {
    if (!isDragging) return

    let frame = 0
    const tick = () => {
      const pointer = pointerRef.current
      const id = dragRef.current?.id
      const panel =
        id === undefined
          ? null
          : (tileRefs.current.get(id)?.closest('dialog') ?? null)

      if (pointer !== null && panel !== null) {
        const box = panel.getBoundingClientRect()
        const speed = getEdgeScrollSpeed({
          edge: AUTOSCROLL_EDGE_PX,
          end: Math.min(box.bottom, window.innerHeight),
          max: AUTOSCROLL_MAX_PX,
          pointer: pointer.y,
          start: Math.max(box.top, 0),
        })

        if (speed !== 0) {
          const before = panel.scrollTop
          panel.scrollTop += speed
          if (panel.scrollTop !== before) scrollStepRef.current()
        }
      }

      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isDragging])

  // Escape puts the tile back and must not close the panel.
  useEffect(() => {
    if (!isDragging) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      finishRef.current(false)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [isDragging])

  return {
    draggedId: drag?.id ?? null,
    /** The tile's CSS `order` while one is lifted; negative, so tiles after the images stay last. */
    getOrder: (id: string) =>
      shownIds === null ? undefined : shownIds.indexOf(id) - shownIds.length,
    getTileProps: (id: string) => ({
      // A finger's hold is a lift, not the browser's menu.
      onContextMenu: (event: MouseEvent<HTMLLIElement>) => {
        if (gestureRef.current?.pointerType === 'touch') event.preventDefault()
      },
      // Only the tile's own capture: a child's loss bubbles up too.
      onLostPointerCapture: (event: PointerEvent<HTMLLIElement>) => {
        if (event.target === event.currentTarget) {
          handlePointerEnd(event, false)
        }
      },
      onPointerCancel: (event: PointerEvent<HTMLLIElement>) =>
        handlePointerEnd(event, false),
      onPointerDown: (event: PointerEvent<HTMLLIElement>) =>
        handlePointerDown(event, id),
      onPointerMove: handlePointerMove,
      onPointerUp: (event: PointerEvent<HTMLLIElement>) =>
        handlePointerEnd(event, true),
      ref: (element: HTMLLIElement) => {
        tileRefs.current.set(id, element)
        element.addEventListener('touchmove', preventLiftedScroll, {
          passive: false,
        })
        return () => {
          tileRefs.current.delete(id)
          element.removeEventListener('touchmove', preventLiftedScroll)
        }
      },
    }),
    /** The tiles in the order shown, the lifted one in its new place. */
    shownIds: shownIds ?? ids,
  }
}
