import type { ContentState } from '@generated/prisma/enums'
import { clsx } from 'clsx'

import styles from './_styles.module.css'

/** A draft's submission (design 07a): waiting for approval, or approved. */
export type SubmissionState = 'pending' | 'approved'

type Props = {
  state: ContentState
  /** Shown instead of the draft tag for a submitted draft. */
  submission?: SubmissionState | null
  className?: string
}

const stateLabels: Record<ContentState | SubmissionState, string> = {
  approved: 'Schváleno',
  archived: 'Archivováno',
  draft: 'Koncept',
  pending: 'Čeká na schválení',
  published: 'Publikováno',
}

export const AdminStateBadge = ({ state, submission, className }: Props) => {
  const shownState =
    state === 'draft' && submission != null ? submission : state

  return (
    <span className={clsx(styles.badge, styles[shownState], className)}>
      {stateLabels[shownState]}
    </span>
  )
}
