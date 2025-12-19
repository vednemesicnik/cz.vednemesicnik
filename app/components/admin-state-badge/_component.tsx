import { clsx } from "clsx"

import type { ContentState } from "@generated/prisma/enums"

import styles from "./_styles.module.css"

type Props = {
  state: ContentState
  className?: string
}

const stateLabels: Record<ContentState, string> = {
  draft: "Koncept",
  published: "Publikováno",
  archived: "Archivováno",
}

export const AdminStateBadge = ({ state, className }: Props) => {
  return (
    <span className={clsx(styles.badge, styles[state], className)}>
      {stateLabels[state]}
    </span>
  )
}
