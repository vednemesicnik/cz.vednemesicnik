import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  dateTime: string
  className?: string
}

/**
 * When a `SignInAttemptsItem` happened, in the 128 px column.
 *
 * @param props.children - The formatted date and time
 * @param props.dateTime - The same moment as an ISO value
 * @returns The `<time>` element
 */
export const SignInAttemptsTime = ({
  children,
  dateTime,
  className,
}: Props) => {
  return (
    <time className={className} dateTime={dateTime}>
      {children}
    </time>
  )
}
