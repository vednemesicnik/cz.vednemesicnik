import type { Handle } from 'remix/component'

const PLAIN = [...'Vedne']
const MIRRORED = [...'měsíčník']

/**
 * The magazine's name with _měsíčník_ mirrored letter by letter, in the text colour.
 *
 * The design system's `Wordmark` with `tone="text"`, in its final, turned state. The
 * animation and the gradient tone belong to the public web; the panel draws the name still.
 * The letters are hidden from a screen reader, which reads the name once from the
 * visually-hidden span instead of letter by letter.
 */
export function Wordmark(_handle: Handle) {
  return () => (
    <span
      class="vdm-wordmark vdm-wordmark--text"
      style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0' }}
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
    </span>
  )
}
