import type { ComponentProps } from 'react'
import { Link } from 'react-router'

type Props = ComponentProps<typeof Link>

// Page transitions come from the layout's `PageTransition`, not the link
// (design 18d, u6r1pxsx).
export const BaseLink = ({ children, prefetch = 'intent', ...rest }: Props) => {
  return (
    <Link prefetch={prefetch} {...rest}>
      {children}
    </Link>
  )
}
