import { clsx } from 'clsx'
import type { FocusEvent, KeyboardEvent, ReactNode } from 'react'

import { Avatar } from '~/components/avatar'
import { Button } from '~/components/button'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Props = {
  name: string
  image: ImageSources
  /** The signed-in author's row, marked *vy*. */
  isOwn?: boolean
  /** Makes the row removable with a ×. */
  onRemove?: () => void
  /** Offers *Vyměnit* where the × would be missing: the only author (24j). */
  onReplace?: () => void
  /** While replacing: *Zrušit* in the row, and Esc or a click outside. */
  onCancelReplace?: () => void
  /** While replacing: the *Vyměnit za* field, under the row in one frame. */
  children?: ReactNode
  className?: string
}

/**
 * One chosen author of an article (design 24j, ivyin4kr): the avatar, the
 * name, *vy* for one's own row, and at most one action, never disabled — a ×
 * when the author may go, or *Vyměnit* for the only author of whoever may
 * replace it. Replacing shows the field under the row in a frame.
 *
 * @param props.onRemove - Removes the author; no confirmation, it can be added
 *   back.
 * @param props.children - The replace field; given, the row is replacing.
 */
export const AuthorListItem = ({
  name,
  image,
  isOwn = false,
  onRemove,
  onReplace,
  onCancelReplace,
  children,
  className,
}: Props) => {
  const isReplacing = children !== undefined

  // Esc the field did not use, or the focus leaving the frame, cancels.
  const handleKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key !== 'Escape' || event.defaultPrevented) return
    event.preventDefault()
    onCancelReplace?.()
  }
  const handleBlur = (event: FocusEvent<HTMLLIElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget)) onCancelReplace?.()
  }

  return (
    <li
      className={clsx(styles.item, isReplacing && styles.replacing, className)}
      onBlur={isReplacing ? handleBlur : undefined}
      onKeyDown={isReplacing ? handleKeyDown : undefined}
    >
      <div className={styles.row}>
        <Avatar image={image} name={name} size={28} />
        <span className={styles.name}>{name}</span>
        {isOwn && <span className={styles.own}>vy</span>}
        {isReplacing ? (
          <Button
            aria-label={'Zrušit výměnu autora'}
            className={styles.action}
            onClick={onCancelReplace}
            size={'sm'}
            type={'button'}
            variant={'ghost'}
          >
            Zrušit
          </Button>
        ) : onRemove !== undefined ? (
          <button
            aria-label={`Odebrat ${name}`}
            className={styles.remove}
            onClick={onRemove}
            type={'button'}
          >
            <svg
              aria-hidden={'true'}
              fill={'none'}
              height={14}
              stroke={'currentColor'}
              strokeLinecap={'round'}
              strokeWidth={2}
              viewBox={'0 0 24 24'}
              width={14}
            >
              <path d={'M18 6 6 18'} />
              <path d={'m6 6 12 12'} />
            </svg>
          </button>
        ) : (
          onReplace !== undefined && (
            <Button
              aria-label={`Vyměnit autora: ${name}`}
              className={styles.action}
              onClick={onReplace}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Vyměnit
            </Button>
          )
        )}
      </div>
      {children}
    </li>
  )
}
