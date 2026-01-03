import { clsx } from 'clsx'
import type { JSX, ReactNode } from 'react'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  className?: string
}

/**
 * BaseHyperlinkIcon component renders a span element wrapper for hyperlink icons.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The icon to be displayed.
 * @returns {JSX.Element} The rendered span element with icon.
 */
export const BaseHyperlinkIcon = ({
  children,
  className,
}: Props): JSX.Element => {
  return <span className={clsx(styles.wrapper, className)}>{children}</span>
}
