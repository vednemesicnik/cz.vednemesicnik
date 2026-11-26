import type { Handle } from 'remix/component'

export type AvatarProps = {
  /** The name the initials come from: the name from Google, or the address before it. */
  name: string
  /** Width and height in pixels. */
  size: number
}

/** Up to two initials, from the first letters of the first two words. */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((part) => part !== '')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

/**
 * The design system's `Avatar` without a picture: initials on the brand gradient. Decoration,
 * because the name always stands beside it.
 */
export function Avatar(handle: Handle<AvatarProps>) {
  return () => {
    let { name, size } = handle.props

    return (
      <span
        aria-hidden="true"
        class="vdm-avatar"
        style={{
          flex: 'none',
          fontSize: `${size * 0.4}px`,
          height: `${size}px`,
          width: `${size}px`,
        }}
      >
        {initials(name)}
      </span>
    )
  }
}
