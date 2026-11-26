// The image viewer's gesture values (design 12b, zn43av9y): starting values,
// to tune on a device.

// The shortest horizontal swipe that pages, in CSS pixels.
export const SWIPE_DISTANCE = 50

// How far a touch moves before it counts as a swipe, a drag or a pan, in CSS
// pixels; less is a tap.
export const GESTURE_START_DISTANCE = 8

// A drag down released past this closes the viewer, in CSS pixels.
export const DRAG_CLOSE_DISTANCE = 120

// A drag down released faster than this closes it too (a flick), in CSS pixels
// per millisecond.
export const DRAG_CLOSE_VELOCITY = 0.5

// The drag distance at which the backdrop has faded as far as it goes.
export const DRAG_FADE_DISTANCE = 320

// The largest zoom, by pinch or double tap.
export const MAX_ZOOM = 2

// A second tap within this time and distance is a double tap.
export const DOUBLE_TAP_TIME = 300
export const DOUBLE_TAP_DISTANCE = 24
