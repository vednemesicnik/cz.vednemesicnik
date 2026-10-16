import { clsx } from 'clsx'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { Tooltip } from '~/components/tooltip'

import styles from './_styles.module.css'

const COPY_PATH =
  'M360-240q-33 0-56.5-23.5T280-320v-480q0-33 23.5-56.5T360-880h360q33 0 56.5 23.5T800-800v480q0 33-23.5 56.5T720-240H360Zm0-80h360v-480H360v480ZM200-80q-33 0-56.5-23.5T120-160v-560h80v560h440v80H200Zm160-240v-480 480Z'
const CHECK_PATH = 'M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z'

const LABEL = 'Kopírovat'
const COPIED_LABEL = 'Zkopírováno'

// How long the check icon stays and „Zkopírováno“ is announced after a copy.
const COPIED_DURATION_MS = 2000

type Props = {
  value: string
  children?: ReactNode
  className?: string
}

/**
 * Inline copy-to-clipboard button of the design system: the value the reader
 * may want to copy, then a copy icon that turns into a check on a success fill
 * for two seconds (jhwfoyxs). The text never changes and has no `title`;
 * „Zkopírováno“ is announced from a status region beside the button, so it
 * never joins the button's name.
 *
 * With a visible value the name is the value and a hidden „Kopírovat“; with
 * the icon alone, „Kopírovat“ is its `aria-label` and its `Tooltip`.
 *
 * @param props.value - What lands in the clipboard.
 * @param props.children - The visible value; without it only the icon shows.
 */
export const CopyButton = ({ value, children, className }: Props) => {
  const [isCopied, setIsCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const hasText = children !== undefined

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(value)
    } catch {
      return
    }

    setIsCopied(true)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(
      () => setIsCopied(false),
      COPIED_DURATION_MS,
    )
  }

  const button = (
    <button
      aria-label={hasText ? undefined : LABEL}
      className={clsx(styles.copyButton, isCopied && styles.copied, className)}
      onClick={handleClick}
      type={'button'}
    >
      {hasText && (
        <>
          <span className={styles.text}>{children}</span>
          <span className={styles.visuallyHidden}>{` ${LABEL}`}</span>
        </>
      )}
      <svg
        aria-hidden={true}
        className={clsx(styles.icon, isCopied && styles.hidden)}
        viewBox={'0 -960 960 960'}
      >
        <path d={COPY_PATH} />
      </svg>
      <svg
        aria-hidden={true}
        className={clsx(styles.icon, !isCopied && styles.hidden)}
        viewBox={'0 -960 960 960'}
      >
        <path d={CHECK_PATH} />
      </svg>
    </button>
  )

  return (
    <>
      {hasText ? button : <Tooltip label={LABEL}>{button}</Tooltip>}
      <span className={styles.visuallyHidden} role={'status'}>
        {isCopied ? COPIED_LABEL : ''}
      </span>
    </>
  )
}
