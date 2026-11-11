import { Avatar } from '~/components/avatar'
import type { ImageSources } from '~/utils/image-store/create-image-sources'

type Props = {
  image: ImageSources
  name: string
}

/**
 * The avatar at the start of an `AuthorRow`, 28 px (24j, 28f).
 *
 * @param props.name - The author's name, for the initials when there is no
 * image.
 */
export const AuthorRowAvatar = ({ image, name }: Props) => (
  <Avatar image={image} name={name} size={28} />
)
