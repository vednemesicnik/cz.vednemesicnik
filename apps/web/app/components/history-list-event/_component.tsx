import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * What happened in a `HistoryListEntry` (*co*), with its `HistoryListActor`
 * after it where one is known.
 *
 * @param props.children - The event's label, e.g. „Publikováno“, and the actor
 * @returns The event's line
 */
export const HistoryListEvent = ({ children, className }: Props) => {
  return <span className={className}>{children}</span>
}
