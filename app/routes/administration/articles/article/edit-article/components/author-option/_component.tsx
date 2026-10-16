import { Avatar } from '~/components/avatar'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Props = {
  name: string
  image: ImageSources
  /** The author role; the association has none (24j). */
  roleLabel: string | null
}

/**
 * A suggestion in the author search (design 24j): the avatar, the name and the
 * role on the right.
 */
export const AuthorOption = ({ name, image, roleLabel }: Props) => (
  <span className={styles.option}>
    <Avatar image={image} name={name} size={24} />
    <span className={styles.name}>{name}</span>
    {roleLabel !== null && <span className={styles.role}>{roleLabel}</span>}
  </span>
)
