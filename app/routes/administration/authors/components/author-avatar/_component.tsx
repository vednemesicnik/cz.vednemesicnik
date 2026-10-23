import { Avatar } from '~/components/avatar'
import { VdmLogo } from '~/components/vdm-logo'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

import styles from './_styles.module.css'

type Props = {
  name: string
  image: ImageSources
  /** The association's author, *Vedneměsíčník, z. s.* (log 0026). */
  isAssociation: boolean
  /** The diameter in pixels: 28 in a row (28a), 56 on the detail (28b). */
  size: number
}

/**
 * An author's picture beside its name (design 28a, 28b): the account's photo
 * or the initials, and the logo for the association, so it is told apart at
 * a glance. Readers skip it; the name stands next to it.
 */
export const AuthorAvatar = ({ name, image, isAssociation, size }: Props) =>
  isAssociation ? (
    <span
      aria-hidden
      className={styles.logo}
      style={{ blockSize: size, inlineSize: size }}
    >
      <VdmLogo />
    </span>
  ) : (
    <Avatar image={image} name={name} size={size} />
  )
