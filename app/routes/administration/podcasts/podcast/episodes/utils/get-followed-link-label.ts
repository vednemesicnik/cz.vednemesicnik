import { getLinkPlatform } from './get-link-platform'

type Options = {
  label: string
  /** The address before the change. */
  previousUrl: string
  url: string
}

/**
 * A link's label after its address changed (design 27d, tly4a163): an empty
 * one, or the platform's name the old address gave, follows the new address;
 * a name changed by hand stays. An address of another platform, or an
 * invalid one, leaves a following label empty.
 *
 * @param options - The label and the address before and after the change.
 * @returns The label to show.
 */
export const getFollowedLinkLabel = ({ label, previousUrl, url }: Options) => {
  const name = label.trim()
  const isFollowing =
    name === '' || name === getLinkPlatform(previousUrl.trim())

  return isFollowing ? (getLinkPlatform(url.trim()) ?? '') : label
}
