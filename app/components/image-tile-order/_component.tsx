import { clsx } from 'clsx'

import styles from './_styles.module.css'

type Props = {
  /** The image's place among the stored ones, which is its place on the web. */
  number: number
  /** The tile can be dragged: the grip follows the number. */
  hasGrip?: boolean
  className?: string
}

/**
 * An image tile's place, first on its preview (design 24b, yj2t50dd): the
 * number, then the grip of a tile that can be dragged, as at the start of a
 * row in 22c. Only a mark: a screen reader hears the number in the „⋯“'s
 * name, and the „⋯“ moves the tile without dragging.
 */
export const ImageTileOrder = ({
  number,
  hasGrip = false,
  className,
}: Props) => (
  <span
    aria-hidden={true}
    className={clsx(styles.imageTileOrder, hasGrip && styles.grip, className)}
  >
    {number}
    {hasGrip && (
      <svg
        aria-hidden={true}
        className={styles.icon}
        fill={'none'}
        height={16}
        stroke={'currentColor'}
        strokeLinecap={'round'}
        strokeLinejoin={'round'}
        strokeWidth={2}
        viewBox={'0 0 24 24'}
        width={16}
      >
        <circle cx={9} cy={5} r={1} />
        <circle cx={9} cy={12} r={1} />
        <circle cx={9} cy={19} r={1} />
        <circle cx={15} cy={5} r={1} />
        <circle cx={15} cy={12} r={1} />
        <circle cx={15} cy={19} r={1} />
      </svg>
    )}
  </span>
)
