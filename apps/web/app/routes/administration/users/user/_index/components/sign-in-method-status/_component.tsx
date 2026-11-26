import type { ReactNode } from 'react'

type Props = {
  className?: string
  children: ReactNode
}

/**
 * A `SignInMethod`'s state, „propojený“ or „platí do …“.
 */
export const SignInMethodStatus = ({ className, children }: Props) => (
  <span className={className}>{children}</span>
)
