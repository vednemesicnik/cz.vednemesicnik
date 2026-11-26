import type { Handle } from 'remix/component'

const PLAIN = [...'Vedne']
const MIRRORED = [...'měsíčník']

export type WordmarkProps = {
  /** `p` where the name stands as a line of its own, as on the sign-in card. */
  as?: 'p' | 'span'
  /** Font size in pixels. The panel draws it at 14, the sign-in card at 28. */
  size?: number
  /** The panel sets 600; the design system's own default is 700. */
  weight?: number
}

/**
 * The magazine's name with _měsíčník_ mirrored letter by letter, in the text colour.
 *
 * The design system's `Wordmark` with `tone="text"`, in its final, turned state. The
 * animation and the gradient tone belong to the public web; this app draws the name still.
 * The letters are hidden from a screen reader, which reads the name once from the
 * visually-hidden span instead of letter by letter.
 */
export function Wordmark(handle: Handle<WordmarkProps>) {
  return () => {
    let { as = 'span', size = 14, weight = 600 } = handle.props
    let Tag = as

    return (
      <Tag
        class="vdm-wordmark vdm-wordmark--text"
        style={{ fontSize: `${size}px`, fontWeight: weight, letterSpacing: '0' }}
      >
        <span class="vdm-sr-only">Vedneměsíčník</span>
        <span aria-hidden="true" class="vdm-wordmark__letters">
          {PLAIN.map((letter) => (
            <span class="vdm-wordmark__l">{letter}</span>
          ))}
          {MIRRORED.map((letter) => (
            <span
              class="vdm-wordmark__l vdm-wordmark__l--flip vdm-wordmark__l--turned"
              data-flip="1"
              data-mirror="1"
            >
              {letter}
            </span>
          ))}
        </span>
      </Tag>
    )
  }
}
