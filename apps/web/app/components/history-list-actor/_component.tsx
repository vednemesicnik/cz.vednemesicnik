import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/**
 * Who did it (*kdo*), after the label in a `HistoryListEvent`: „Publikováno ·
 * Marie Horáková“. An event older than the log has none.
 *
 * @param props.children - The person's name
 * @returns The separator and the name, as text of the event's line
 */
export const HistoryListActor = ({ children }: Props) => {
  return <> · {children}</>
}
