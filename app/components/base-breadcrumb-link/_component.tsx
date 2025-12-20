import type { ComponentProps } from 'react'
import { NavLink, useMatch } from 'react-router'

type Props = ComponentProps<typeof NavLink>

export const BaseBreadcrumbLink = ({
  children,
  to,
  prefetch = 'intent',
  end = true,
  viewTransition = true,
  ...rest
}: Props) => {
  const path = typeof to === 'string' ? to : (to.pathname ?? '')
  const pathMatch = useMatch({ end, path })
  const isCurrentPage = pathMatch !== null

  return (
    <NavLink
      aria-current={isCurrentPage ? 'page' : undefined}
      end={end}
      prefetch={prefetch}
      to={to}
      viewTransition={viewTransition}
      {...rest}
    >
      {children}
    </NavLink>
  )
}
