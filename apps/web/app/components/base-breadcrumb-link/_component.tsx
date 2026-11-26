import type { ComponentProps } from 'react'
import { NavLink, useMatch } from 'react-router'

type Props = ComponentProps<typeof NavLink>

export const BaseBreadcrumbLink = ({
  children,
  to,
  prefetch = 'intent',
  end = true,
  ...rest
}: Props) => {
  // A step back to a remembered list carries its query; the page is its path.
  const path =
    typeof to === 'string' ? (to.split('?')[0] ?? '') : (to.pathname ?? '')
  const pathMatch = useMatch({ end, path })
  const isCurrentPage = pathMatch !== null

  return (
    <NavLink
      aria-current={isCurrentPage ? 'page' : undefined}
      end={end}
      prefetch={prefetch}
      to={to}
      {...rest}
    >
      {children}
    </NavLink>
  )
}
