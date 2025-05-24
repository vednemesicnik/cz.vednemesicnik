import type { ComponentProps } from "react"
import { Link } from "react-router"

type Props = ComponentProps<typeof Link>

export const BaseLink = ({ children, ...rest }: Props) => {
  return <Link {...rest}>{children}</Link>
}
