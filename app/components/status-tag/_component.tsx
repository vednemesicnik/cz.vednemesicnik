import type { ContentState } from '@generated/prisma/enums'
import { clsx } from 'clsx'

import styles from './_styles.module.css'

/** A content state, or a draft's submission (design 07a): waiting or approved. */
export type StatusTagState = ContentState | 'pending' | 'approved'

type Props = {
  state: StatusTagState
  detail?: string
  className?: string
}

/** The tag's words, also for a state written out as text (design 22c). */
export const STATUS_TAG_LABELS: Record<StatusTagState, string> = {
  approved: 'Schváleno',
  archived: 'Archivováno',
  draft: 'Koncept',
  pending: 'Čeká na schválení',
  published: 'Publikováno',
}

/**
 * The design system's state tag: grey draft, yellow waiting, green-outlined
 * approved, green published, grey archived (design 07a, 22a).
 *
 * @param props.detail - One fact under the tag, never an instruction (22b),
 *   e.g. „od 25. 9. 2026“.
 */
export const StatusTag = ({ state, detail, className }: Props) => (
  <span className={clsx(styles.status, styles[state], className)}>
    <span className={styles.tag}>{STATUS_TAG_LABELS[state]}</span>
    {detail !== undefined && <span className={styles.detail}>{detail}</span>}
  </span>
)
