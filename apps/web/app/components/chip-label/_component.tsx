import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * The value's name in a `Chip`.
 */
export const ChipLabel = ({ children, className }: Props) => (
  <span className={className}>{children}</span>
)
