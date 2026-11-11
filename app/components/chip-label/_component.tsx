import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

/**
 * The value's name in a `Chip`.
 */
export const ChipLabel = ({ children }: Props) => <span>{children}</span>
