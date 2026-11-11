import {
  type PointerEvent,
  type RefObject,
  useCallback,
  useRef,
  useState,
} from 'react'

import {
  DOUBLE_TAP_DISTANCE,
  DOUBLE_TAP_TIME,
  GESTURE_START_DISTANCE,
  MAX_ZOOM,
  SWIPE_DISTANCE,
} from '~/config/image-viewer-config'
import { clampPanOffset } from '~/utils/image-viewer/clamp-pan-offset'
import { shouldCloseOnRelease } from '~/utils/image-viewer/should-close-on-release'

type Point = {
  x: number
  y: number
}

type View = {
  scale: number
  offset: Point
  dragDistance: number
  isActive: boolean
}

type Mode = 'idle' | 'pending' | 'swipe' | 'drag' | 'pan' | 'pinch' | 'none'

type Gesture = {
  mode: Mode
  start: Point
  startOffset: Point
  startScale: number
  startDistance: number
  startCenter: Point
  lastY: number
  lastTime: number
  velocity: number
}

type Tap = {
  point: Point
  time: number
}

type Options = {
  stageRef: RefObject<HTMLElement | null>
  frameRef: RefObject<HTMLElement | null>
  canPage: boolean
  onPrevious: () => void
  onNext: () => void
  onDismiss: () => void
}

// A pinch let go below this snaps back to the whole photo.
const SNAP_TO_WHOLE_SCALE = 1.05

const RESTING_VIEW: View = {
  dragDistance: 0,
  isActive: false,
  offset: { x: 0, y: 0 },
  scale: 1,
}

const IDLE_GESTURE: Gesture = {
  lastTime: 0,
  lastY: 0,
  mode: 'idle',
  start: { x: 0, y: 0 },
  startCenter: { x: 0, y: 0 },
  startDistance: 1,
  startOffset: { x: 0, y: 0 },
  startScale: 1,
  velocity: 0,
}

const getDistance = (first: Point, second: Point) =>
  Math.hypot(first.x - second.x, first.y - second.y)

const getCenter = (first: Point, second: Point) => ({
  x: (first.x + second.x) / 2,
  y: (first.y + second.y) / 2,
})

/**
 * The image viewer's touch gestures on the photo (design 12b, zn43av9y). At
 * the whole photo a side swipe pages and a drag down closes; pinch and double
 * tap zoom up to {@link MAX_ZOOM} at the gesture's point, and one finger then
 * pans within reach of the photo's edges. A mouse does none of it: the arrows,
 * keys and the browser's own zoom serve it.
 *
 * @param options.stageRef - The area the photo stands in, centred.
 * @param options.frameRef - The photo's frame, at its unscaled size.
 * @param options.canPage - Whether a swipe pages (more than one image).
 * @param options.onDismiss - Called when a drag down is let go to close; the
 *   photo is left down there for the close to carry on.
 * @returns The handlers for the frame, the photo's `scale`, `offset` and
 *   `dragDistance`, `isActive` while a finger moves it, and `reset`, which
 *   brings back the whole photo (for the next image or the next opening).
 */
export const useViewerGestures = ({
  stageRef,
  frameRef,
  canPage,
  onPrevious,
  onNext,
  onDismiss,
}: Options) => {
  const [view, setView] = useState<View>(RESTING_VIEW)
  const viewRef = useRef<View>(RESTING_VIEW)
  const pointersRef = useRef(new Map<number, Point>())
  const gestureRef = useRef<Gesture>(IDLE_GESTURE)
  const lastTapRef = useRef<Tap | null>(null)

  const update = (change: Partial<View>) => {
    viewRef.current = { ...viewRef.current, ...change }
    setView(viewRef.current)
  }

  const reset = useCallback(() => {
    pointersRef.current.clear()
    gestureRef.current = IDLE_GESTURE
    lastTapRef.current = null
    viewRef.current = RESTING_VIEW
    setView(RESTING_VIEW)
  }, [])

  // From the viewport to the stage's centre, which is the photo's centre too.
  const toStage = (point: Point) => {
    const rectangle = stageRef.current?.getBoundingClientRect()

    if (rectangle === undefined) return point

    return {
      x: point.x - (rectangle.left + rectangle.width / 2),
      y: point.y - (rectangle.top + rectangle.height / 2),
    }
  }

  const clampOffset = (offset: Point, scale: number) => {
    const frame = frameRef.current
    const stage = stageRef.current

    if (frame === null || stage === null) return offset

    return clampPanOffset(
      offset,
      scale,
      { height: frame.offsetHeight, width: frame.offsetWidth },
      { height: stage.clientHeight, width: stage.clientWidth },
    )
  }

  const toggleZoom = (point: Point) => {
    if (viewRef.current.scale > 1) {
      update({ offset: { x: 0, y: 0 }, scale: 1 })
      return
    }

    // Scaled about the centre, the tapped point stays put at point × (1 − zoom).
    update({
      offset: clampOffset(
        { x: point.x * (1 - MAX_ZOOM), y: point.y * (1 - MAX_ZOOM) },
        MAX_ZOOM,
      ),
      scale: MAX_ZOOM,
    })
  }

  const startSingle = (point: Point, time: number, mode: Mode) => {
    gestureRef.current = {
      ...IDLE_GESTURE,
      lastTime: time,
      lastY: point.y,
      mode,
      start: point,
      startOffset: viewRef.current.offset,
    }
  }

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse') return

    event.currentTarget.setPointerCapture(event.pointerId)
    const point = { x: event.clientX, y: event.clientY }
    const pointers = pointersRef.current
    pointers.set(event.pointerId, point)

    if (pointers.size === 1) {
      startSingle(point, event.timeStamp, 'pending')
      return
    }

    const [first, second] = [...pointers.values()]

    if (first === undefined || second === undefined) return

    gestureRef.current = {
      ...IDLE_GESTURE,
      mode: 'pinch',
      startCenter: toStage(getCenter(first, second)),
      startDistance: Math.max(1, getDistance(first, second)),
      startOffset: viewRef.current.offset,
      startScale: viewRef.current.scale,
    }
    update({ dragDistance: 0, isActive: true })
  }

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const pointers = pointersRef.current

    if (!pointers.has(event.pointerId)) return

    const point = { x: event.clientX, y: event.clientY }
    pointers.set(event.pointerId, point)
    const gesture = gestureRef.current

    if (gesture.mode === 'pinch') {
      const [first, second] = [...pointers.values()]

      if (first === undefined || second === undefined) return

      const scale = Math.min(
        MAX_ZOOM,
        Math.max(
          1,
          (gesture.startScale * getDistance(first, second)) /
            gesture.startDistance,
        ),
      )
      // The photo's point under the fingers at the start stays under them.
      const center = toStage(getCenter(first, second))
      const anchor = {
        x: (gesture.startCenter.x - gesture.startOffset.x) / gesture.startScale,
        y: (gesture.startCenter.y - gesture.startOffset.y) / gesture.startScale,
      }
      update({
        isActive: true,
        offset: clampOffset(
          { x: center.x - scale * anchor.x, y: center.y - scale * anchor.y },
          scale,
        ),
        scale,
      })
      return
    }

    const distanceX = point.x - gesture.start.x
    const distanceY = point.y - gesture.start.y

    if (gesture.mode === 'pending') {
      if (Math.hypot(distanceX, distanceY) < GESTURE_START_DISTANCE) return

      if (viewRef.current.scale > 1) {
        gesture.mode = 'pan'
      } else if (distanceY > Math.abs(distanceX)) {
        gesture.mode = 'drag'
      } else if (Math.abs(distanceX) > Math.abs(distanceY)) {
        gesture.mode = 'swipe'
      } else {
        // Up: nothing.
        gesture.mode = 'none'
      }
    }

    if (gesture.mode === 'pan') {
      update({
        isActive: true,
        offset: clampOffset(
          {
            x: gesture.startOffset.x + distanceX,
            y: gesture.startOffset.y + distanceY,
          },
          viewRef.current.scale,
        ),
      })
    } else if (gesture.mode === 'drag') {
      const elapsed = event.timeStamp - gesture.lastTime

      if (elapsed > 0) {
        gesture.velocity = (point.y - gesture.lastY) / elapsed
        gesture.lastY = point.y
        gesture.lastTime = event.timeStamp
      }

      update({ dragDistance: Math.max(0, distanceY), isActive: true })
    }
  }

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const pointers = pointersRef.current

    if (!pointers.has(event.pointerId)) return

    pointers.delete(event.pointerId)
    const point = { x: event.clientX, y: event.clientY }
    const gesture = gestureRef.current

    if (gesture.mode === 'pinch') {
      if (viewRef.current.scale < SNAP_TO_WHOLE_SCALE) {
        update({ offset: { x: 0, y: 0 }, scale: 1 })
      }

      const [remaining] = [...pointers.values()]

      if (remaining === undefined) {
        gestureRef.current = IDLE_GESTURE
        update({ isActive: false })
      } else {
        // The finger left behind pans on from where it is.
        startSingle(
          remaining,
          event.timeStamp,
          viewRef.current.scale > 1 ? 'pan' : 'none',
        )
      }
      return
    }

    if (pointers.size > 0) return

    const distanceX = point.x - gesture.start.x
    const distanceY = point.y - gesture.start.y
    gestureRef.current = IDLE_GESTURE

    if (gesture.mode === 'drag') {
      const distance = Math.max(0, distanceY)

      if (shouldCloseOnRelease({ distance, velocity: gesture.velocity })) {
        update({
          dragDistance: stageRef.current?.clientHeight ?? distance,
          isActive: false,
        })
        onDismiss()
      } else {
        update({ dragDistance: 0, isActive: false })
      }
      return
    }

    update({ isActive: false })

    if (gesture.mode === 'swipe') {
      if (canPage && Math.abs(distanceX) >= SWIPE_DISTANCE) {
        if (distanceX < 0) onNext()
        else onPrevious()
      }
      return
    }

    if (gesture.mode !== 'pending') return

    const lastTap = lastTapRef.current
    const isDoubleTap =
      lastTap !== null &&
      event.timeStamp - lastTap.time <= DOUBLE_TAP_TIME &&
      getDistance(point, lastTap.point) <= DOUBLE_TAP_DISTANCE

    if (isDoubleTap) {
      lastTapRef.current = null
      toggleZoom(toStage(point))
    } else {
      lastTapRef.current = { point, time: event.timeStamp }
    }
  }

  const onPointerCancel = (event: PointerEvent<HTMLElement>) => {
    pointersRef.current.delete(event.pointerId)
    gestureRef.current = IDLE_GESTURE
    update({ dragDistance: 0, isActive: false })
  }

  return {
    dragDistance: view.dragDistance,
    handlers: { onPointerCancel, onPointerDown, onPointerMove, onPointerUp },
    isActive: view.isActive,
    offset: view.offset,
    reset,
    scale: view.scale,
  }
}
