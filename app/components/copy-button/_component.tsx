import { clsx } from 'clsx'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { Tooltip } from '~/components/tooltip'

import styles from './_styles.module.css'

// Lucide copy and check (n0kx6u98).
const COPY_PATH = 'M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'
const CHECK_PATH = 'M20 6 9 17l-5-5'

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
        viewBox={'0 0 24 24'}
      >
        <rect height={14} rx={2} ry={2} width={14} x={8} y={8} />
        <path d={COPY_PATH} />
      </svg>
      <svg
        aria-hidden={true}
        className={clsx(styles.icon, !isCopied && styles.hidden)}
        viewBox={'0 0 24 24'}
      >
        <path d={CHECK_PATH} />
      </svg>
    </button>
  )

  return (
    <>
      {hasText ? (
        button
      ) : (
        <Tooltip className={styles.tooltip} label={LABEL}>
          {button}
        </Tooltip>
      )}
      <span className={styles.visuallyHidden} role={'status'}>
        {isCopied ? COPIED_LABEL : ''}
      </span>
    </>
  )
}
