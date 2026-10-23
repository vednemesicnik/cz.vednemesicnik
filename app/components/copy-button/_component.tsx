import { clsx } from 'clsx'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { CheckIcon } from '~/components/icons/check-icon'
import { CopyIcon } from '~/components/icons/copy-icon'
import { Tooltip } from '~/components/tooltip'

import styles from './_styles.module.css'

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
      <CopyIcon className={clsx(styles.icon, isCopied && styles.hidden)} />
      <CheckIcon className={clsx(styles.icon, !isCopied && styles.hidden)} />
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
