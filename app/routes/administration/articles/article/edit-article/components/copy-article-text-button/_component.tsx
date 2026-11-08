import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'

import { Button, type Variant } from '~/components/button'

import { getArticleClipboardText } from '../../utils/get-article-clipboard-text'
import styles from './_styles.module.css'

// How long „Zkopírováno“ stays announced after a copy.
const COPIED_DURATION_MS = 2000

// The text isn't on screen as one piece, so nothing is selected; the author
// selects it in the editor (design 17b, copy uvjknd7d).
const FAILED_SENTENCE =
  'Označte celý text v editoru a zkopírujte ho — kopírování tlačítkem se nepodařilo.'

type Props = {
  /** The text editor's value as the author sees it now (Tiptap JSON or `''`). */
  getContent: () => string
  variant?: Extract<Variant, 'outline' | 'ghost'>
}

/**
 * *Zkopírovat celý text* (design 24h, 24i): the whole article text, saved or
 * not, into the clipboard as HTML and as plain text, so the author can send it
 * to whoever edits it now. After a copy that got through, the label reads
 * „Zkopírováno“ for two seconds in the same width and it is announced, as the
 * design system's `CopyButton` does it (29c; copy kjcijk1q). When the clipboard
 * refuses, a sentence under the button says to copy it from the editor; it goes
 * on the next click or copy (17b).
 *
 * @param props.getContent - Reads the text to copy at the click.
 * @param props.variant - `outline` in the editor and 24h, `ghost` among the
 *   24i dialog's buttons.
 */
export const CopyArticleTextButton = ({
  getContent,
  variant = 'outline',
}: Props) => {
  const [isCopied, setIsCopied] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  // Copying from the editor by hand is what the sentence asked for.
  useEffect(() => {
    if (!hasFailed) return

    const handleCopy = () => setHasFailed(false)
    document.addEventListener('copy', handleCopy)

    return () => document.removeEventListener('copy', handleCopy)
  }, [hasFailed])

  const copy = async () => {
    clearTimeout(timeoutRef.current)
    setIsCopied(false)
    setHasFailed(false)
    const { html, text } = getArticleClipboardText(getContent())

    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
    } catch {
      // Without rich clipboard support, plain text still saves the words.
      try {
        await navigator.clipboard.writeText(text)
      } catch {
        setHasFailed(true)
        return
      }
    }

    setIsCopied(true)
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(
      () => setIsCopied(false),
      COPIED_DURATION_MS,
    )
  }

  // One item with its sentence, so a row of dialog buttons keeps its order.
  return (
    <span className={styles.root}>
      <Button
        onClick={() => void copy()}
        size={'sm'}
        type={'button'}
        variant={variant}
      >
        {/* Both labels take one cell, so the button keeps its width. */}
        <span className={styles.labels}>
          <span className={clsx(styles.label, isCopied && styles.hidden)}>
            Zkopírovat celý text
          </span>
          <span className={clsx(styles.label, !isCopied && styles.hidden)}>
            Zkopírováno
          </span>
        </span>
      </Button>
      <span
        aria-live={'polite'}
        className={hasFailed ? styles.failedSentence : styles.status}
      >
        {isCopied && 'Zkopírováno'}
        {hasFailed && FAILED_SENTENCE}
      </span>
    </span>
  )
}
