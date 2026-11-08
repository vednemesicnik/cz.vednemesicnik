import { clsx } from 'clsx'
import { type ReactNode, useEffect, useRef, useState } from 'react'

import { Button } from '~/components/button'
import { CheckIcon } from '~/components/icons/check-icon'
import { CopyIcon } from '~/components/icons/copy-icon'
import { Tooltip } from '~/components/tooltip'

import styles from './_styles.module.css'

const LABEL = 'Kopírovat'
const COPIED_LABEL = 'Zkopírováno'

// What to do when the clipboard refuses, in each surface's voice: with a mouse
// the keyboard shortcut, without one plain selecting, which no gesture promises
// (design 17b, copy uvjknd7d, zs8dklyw).
const FAILED_SENTENCES = {
  administration: {
    fine: 'Zkopírujte označený text pomocí Ctrl+C, na Macu ⌘C — kopírování tlačítkem se nepodařilo.',
    touch:
      'Označte celý text a zkopírujte ho — kopírování tlačítkem se nepodařilo.',
  },
  web: {
    fine: 'Kopírování se nepovedlo. Zkopírujte označený text pomocí Ctrl+C, na Macu ⌘C.',
    touch: 'Kopírování se nepovedlo. Označte celý text a zkopírujte ho.',
  },
} as const

type Pointer = keyof (typeof FAILED_SENTENCES)['web']

// How long the check icon and „Zkopírováno“ stay after a copy.
const COPIED_DURATION_MS = 2000

type Status = 'idle' | 'copied' | { failed: Pointer }

type Props = {
  value: string
  children?: ReactNode
  className?: string
  surface?: keyof typeof FAILED_SENTENCES
}

/**
 * Copy to the clipboard, as the design system draws it.
 *
 * With a visible value, the value is plain text and beside it stands a `Button`
 * (outline, sm) with the copy icon and „Kopírovat“, so a reader sees what the
 * click does before clicking, on touch too (17c, 4c4ynjih, the owner's decision
 * of 8 Nov 2026). The button goes beside the value when it fits, otherwise under
 * it. After a copy it shows a check and „Zkopírováno“ for two seconds in the same
 * width, and a status region beside it announces „Zkopírováno“. Its name is
 * „Kopírovat“ and the value, so each button on a page names what it copies.
 * Its tap area is 44 px high without moving anything (17b).
 *
 * With the icon alone, „Kopírovat“ is its `aria-label` and its `Tooltip`
 * (jhwfoyxs), and a copy turns the icon into a check on a success fill.
 *
 * When the clipboard refuses, a visible value is selected, the focus stays on
 * the button so Ctrl+C or ⌘C copies it, and a sentence under the value says so;
 * it goes on the next click or copy (17b). With a mouse the sentence names the
 * keyboard shortcut, without one it asks to select the whole text and copy it;
 * the icon alone has nothing to select and stays as it is.
 *
 * @param props.value - What lands in the clipboard.
 * @param props.children - The visible value; without it only the icon shows.
 * @param props.className - For the value's box, or the icon-only button.
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
  const failedPointer = typeof status === 'object' ? status.failed : null

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  // Copying the selection by hand is what the sentence asked for.
  useEffect(() => {
    if (failedPointer === null) return

    const handleCopy = () => setStatus('idle')
    document.addEventListener('copy', handleCopy)

    return () => document.removeEventListener('copy', handleCopy)
  }, [failedPointer])

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
      setStatus({
        failed: window.matchMedia('(any-pointer: fine)').matches
          ? 'fine'
          : 'touch',
      })
      return
    }

    setStatus('copied')
    timeoutRef.current = setTimeout(() => setStatus('idle'), COPIED_DURATION_MS)
  }

  const statusRegion = (
    <span
      className={
        failedPointer === null ? styles.visuallyHidden : styles.failedSentence
      }
      role={'status'}
    >
      {isCopied && COPIED_LABEL}
      {failedPointer !== null && FAILED_SENTENCES[surface][failedPointer]}
    </span>
  )

  if (!hasText) {
    return (
      <>
        <Tooltip className={styles.tooltip} label={LABEL}>
          <button
            aria-label={LABEL}
            className={clsx(
              styles.iconButton,
              isCopied && styles.copied,
              className,
            )}
            onClick={handleClick}
            ref={buttonRef}
            type={'button'}
          >
            <CopyIcon
              className={clsx(styles.icon, isCopied && styles.hidden)}
            />
            <CheckIcon
              className={clsx(styles.icon, !isCopied && styles.hidden)}
            />
          </button>
        </Tooltip>
        {statusRegion}
      </>
    )
  }

  return (
    <>
      <span className={clsx(styles.row, className)}>
        <span className={styles.value} ref={textRef}>
          {children}
        </span>
        <Button
          className={styles.button}
          onClick={handleClick}
          ref={buttonRef}
          size={'sm'}
          type={'button'}
          variant={'outline'}
        >
          <span className={styles.visuallyHidden}>{`${LABEL} ${value}`}</span>
          {/* Both icons and both words take one cell each, so the button keeps
              its width when they change. */}
          <span aria-hidden={true} className={styles.content}>
            <span className={styles.cell}>
              <CopyIcon className={clsx(isCopied && styles.hidden)} />
              <CheckIcon className={clsx(!isCopied && styles.hidden)} />
            </span>
            <span className={styles.cell}>
              <span className={clsx(isCopied && styles.hidden)}>{LABEL}</span>
              <span className={clsx(!isCopied && styles.hidden)}>
                {COPIED_LABEL}
              </span>
            </span>
          </span>
        </Button>
      </span>
      {statusRegion}
    </>
  )
}
