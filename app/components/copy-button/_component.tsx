import { clsx } from 'clsx'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { CheckIcon } from '~/components/icons/check-icon'
import { CopyIcon } from '~/components/icons/copy-icon'
import { Tooltip } from '~/components/tooltip'

import styles from './_styles.module.css'

const LABEL = 'Kopírovat'
const COPIED_LABEL = 'Zkopírováno'

// What to do when the clipboard refuses, in each surface's voice (design 17b,
// copy uvjknd7d).
const FAILED_SENTENCES = {
  administration:
    'Zkopírujte označený text pomocí Ctrl+C, na Macu ⌘C — kopírování tlačítkem se nepodařilo.',
  web: 'Kopírování se nepovedlo. Zkopírujte označený text pomocí Ctrl+C, na Macu ⌘C.',
} as const

// How long the check icon stays and „Zkopírováno“ is announced after a copy.
const COPIED_DURATION_MS = 2000

type Status = 'idle' | 'copied' | 'failed'

type Props = {
  value: string
  children?: ReactNode
  className?: string
  surface?: keyof typeof FAILED_SENTENCES
}

/**
 * Inline copy-to-clipboard button of the design system: the value the reader
 * may want to copy, then a copy icon that turns into a check on a success fill
 * for two seconds (jhwfoyxs). The text never changes and has no `title`;
 * „Zkopírováno“ is announced from a status region beside the button, so it
 * never joins the button's name.
 *
 * With a visible value the name is the value and a hidden „Kopírovat“; with
 * the icon alone, „Kopírovat“ is its `aria-label` and its `Tooltip`. The value
 * can always be selected by hand, and the tap target is at least 44 px (17b).
 *
 * When the clipboard refuses, a visible value is selected, the focus stays on
 * the button so Ctrl+C or ⌘C copies it, and a sentence under the row says so;
 * it goes on the next click or copy (17b). The sentence names keyboard shortcuts,
 * so it shows only with a fine pointer until a phone wording is approved; the
 * icon alone has nothing to select and stays as it is.
 *
 * @param props.value - What lands in the clipboard.
 * @param props.children - The visible value; without it only the icon shows.
 * @param props.surface - Whose voice the failure sentence speaks in: `web` for the
 *   website and its forms (default), `administration` for the administration.
 */
export const CopyButton = ({
  value,
  children,
  className,
  surface = 'web',
}: Props) => {
  const [status, setStatus] = useState<Status>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const hasText = children !== undefined
  const isCopied = status === 'copied'

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  // Copying the selection by hand is what the sentence asked for.
  useEffect(() => {
    if (status !== 'failed') return

    const handleCopy = () => setStatus('idle')
    document.addEventListener('copy', handleCopy)

    return () => document.removeEventListener('copy', handleCopy)
  }, [status])

  const selectText = () => {
    const selection = window.getSelection()
    if (textRef.current === null || selection === null) return

    // Focus first: focusing can collapse a selection made before it.
    buttonRef.current?.focus({ preventScroll: true })
    const range = document.createRange()
    range.selectNodeContents(textRef.current)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const handleClick = async () => {
    clearTimeout(timeoutRef.current)
    setStatus('idle')

    try {
      await navigator.clipboard.writeText(value)
    } catch {
      if (!hasText) return

      selectText()
      if (window.matchMedia('(any-pointer: fine)').matches) setStatus('failed')
      return
    }

    setStatus('copied')
    timeoutRef.current = setTimeout(() => setStatus('idle'), COPIED_DURATION_MS)
  }

  const button = (
    <button
      aria-label={hasText ? undefined : LABEL}
      className={clsx(styles.copyButton, isCopied && styles.copied, className)}
      onClick={handleClick}
      ref={buttonRef}
      type={'button'}
    >
      {hasText && (
        <>
          <span className={styles.text} ref={textRef}>
            {children}
          </span>
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
      <span
        className={
          status === 'failed' ? styles.failedSentence : styles.visuallyHidden
        }
        role={'status'}
      >
        {isCopied && COPIED_LABEL}
        {status === 'failed' && FAILED_SENTENCES[surface]}
      </span>
    </>
  )
}
