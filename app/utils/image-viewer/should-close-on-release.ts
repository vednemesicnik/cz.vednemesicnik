import {
  DRAG_CLOSE_DISTANCE,
  DRAG_CLOSE_VELOCITY,
} from '~/config/image-viewer-config'

type Release = {
  distance: number
  velocity: number
}

/**
 * Whether a drag down on the photo closes the viewer when the finger lifts
 * (design 12b, zn43av9y).
 *
 * @param release.distance - How far the photo has been dragged down, in CSS
 *   pixels; zero or less for no drag.
 * @param release.velocity - The finger's speed downward at release, in CSS
 *   pixels per millisecond; negative when it was moving up.
 * @returns `true` past {@link DRAG_CLOSE_DISTANCE}, or on a flick down faster
 *   than {@link DRAG_CLOSE_VELOCITY}; `false` springs the photo back.
 */
export const shouldCloseOnRelease = ({ distance, velocity }: Release) => {
  if (distance <= 0) return false

  return distance > DRAG_CLOSE_DISTANCE || velocity > DRAG_CLOSE_VELOCITY
}
