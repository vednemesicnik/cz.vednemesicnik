import type { ContentState } from '@generated/prisma/enums'
import { clsx } from 'clsx'

import styles from './_styles.module.css'

type Props = {
  state: ContentState
  className?: string
}

const stateLabels: Record<ContentState, string> = {
  archived: 'Archivováno',
  draft: 'Koncept',
  published: 'Publikováno',
}

export const AdminStateBadge = ({ state, className }: Props) => {
  return (
    <span className={clsx(styles.badge, styles[state], className)}>
      {stateLabels[state]}
    </span>
  )
}
