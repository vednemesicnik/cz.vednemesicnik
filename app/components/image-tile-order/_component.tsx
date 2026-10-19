import { clsx } from 'clsx'

import { GripVerticalIcon } from '~/components/icons/grip-vertical-icon'

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
    {hasGrip && <GripVerticalIcon className={styles.icon} />}
  </span>
)
