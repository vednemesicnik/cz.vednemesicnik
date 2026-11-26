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
  /** The line under the tag: _založen 10. 11._ (`12a`). */
  detail?: string
  /** The line beside the tag rather than under it: an author's clause in the open row (`12b`). */
  isInline?: boolean
  /** On a tinted surface, such as a decided card of _Ke kontrole_ (`13b`): filled with the page. */
  isOnTint?: boolean
  tone: StatusTone
}

/**
 * The design system's state tag. It writes only the `vdm-status` markup and leaves the look to
 * `components.css`, so the pill keeps the width of its text in any cell (`3dzxetrk`).
 */
export function StatusTag(handle: Handle<StatusTagProps>) {
  return () => (
    <span
      class={`vdm-status vdm-status--${TONE_CLASSES[handle.props.tone]}${handle.props.isOnTint === true ? ' vdm-status--on-tint' : ''}${handle.props.isInline === true ? ' vdm-status--inline' : ''}`}
    >
      <span class="vdm-status__tag">{handle.props.children}</span>
      {handle.props.detail === undefined ? null : (
        <span class="vdm-status__detail">{handle.props.detail}</span>
      )}
    </span>
  )
}
