import { clsx } from 'clsx'

import { Avatar } from '~/components/avatar'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Props = {
  name: string
  image: ImageSources
  /** The signed-in author's row, marked *vy*. */
  isOwn?: boolean
  /** Makes the row removable with a ×; without it the row has none (24j). */
  onRemove?: () => void
  className?: string
}

/**
 * One chosen author of an article (design 24j): the avatar, the name, *vy* for
 * one's own row, and a × when the author may go. A × that could do nothing is
 * left out, never disabled.
 *
 * @param props.onRemove - Removes the author; no confirmation, it can be added
 *   back.
 */
export const AuthorListItem = ({
  name,
  image,
  isOwn = false,
  onRemove,
  className,
}: Props) => (
  <li className={clsx(styles.item, className)}>
    <Avatar image={image} name={name} size={28} />
    <span className={styles.name}>
      {name}
      {isOwn && <span className={styles.own}> vy</span>}
    </span>
    {onRemove !== undefined && (
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
    )}
  </li>
)
