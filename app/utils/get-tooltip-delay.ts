const SHOW_DELAY_MS = 500
const SKIP_DELAY_WINDOW_MS = 300

/**
 * How long a tooltip waits after the pointer arrives (jb81di02): 500 ms, or
 * none when another tooltip hid less than 300 ms ago, so moving along a row
 * of buttons shows each label at once.
 *
 * @param now - The time the pointer arrived, in milliseconds.
 * @param lastHiddenAt - When a tooltip last hid, in milliseconds; 0 if never.
 * @returns The delay in milliseconds.
 */
export const getTooltipDelay = (now: number, lastHiddenAt: number): number =>
  now - lastHiddenAt < SKIP_DELAY_WINDOW_MS ? 0 : SHOW_DELAY_MS
