import type { Handle, RemixNode } from 'remix/component'

/**
 * The tones the design system's `StatusTag` takes, by who is on the move: gray nobody, amber
 * waiting for you, green outline done in the newsroom, green fill done, red something went wrong
 * and waits for you, blue in motion.
 */
export type StatusTone = 'done' | 'done-outline' | 'neutral' | 'problem' | 'running' | 'waiting'

/* The design system's `TONE_CLASSES`: a tone names a modifier its stylesheet defines. */
const TONE_CLASSES: Record<StatusTone, string> = {
  done: 'published',
  'done-outline': 'approved',
  neutral: 'draft',
  problem: 'problem',
  running: 'running',
  waiting: 'pending',
}

export type StatusTagProps = {
  children?: RemixNode
  tone: StatusTone
}

/**
 * The design system's state tag. It writes only the `vdm-status` markup and leaves the look to
 * `components.css`, so the pill keeps the width of its text in any cell (`3dzxetrk`).
 */
export function StatusTag(handle: Handle<StatusTagProps>) {
  return () => (
    <span class={`vdm-status vdm-status--${TONE_CLASSES[handle.props.tone]}`}>
      <span class="vdm-status__tag">{handle.props.children}</span>
    </span>
  )
}
