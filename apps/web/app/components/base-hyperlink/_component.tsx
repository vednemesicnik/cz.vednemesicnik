import { clsx } from 'clsx'
import type { ComponentProps, JSX } from 'react'
import styles from './_styles.module.css'

type Props = ComponentProps<'a'>

/**
 * BaseHyperlink component renders an anchor (`<a>`) element.
 * It opens the link in a new tab and prevents referrer information from being sent.
 *
 * @param {Object} props - The properties object.
 * @param {React.ReactNode} props.children - The content to be displayed inside the anchor element.
 * @param {Object} [props.rest] - Additional properties to be passed to the anchor element.
 * @returns {JSX.Element} The rendered anchor element.
 */
export const BaseHyperlink = ({
  children,
  className,
  rel = 'noopener',
  target = '_blank',
  ...rest
}: Props): JSX.Element => {
  return (
    <a
      className={clsx(styles.link, className)}
      rel={rel}
      target={target}
      {...rest}
    >
      {children}
    </a>
  )
}
