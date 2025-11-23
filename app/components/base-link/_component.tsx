import type { ComponentProps } from "react"
import { Link } from "react-router"

type Props = ComponentProps<typeof Link>

export const BaseLink = ({
  children,
  prefetch = "intent",
  viewTransition = true,
  ...rest
}: Props) => {
  return (
    <Link prefetch={prefetch} viewTransition={viewTransition} {...rest}>
      {children}
    </Link>
  )
}
