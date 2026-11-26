import styles from './_styles.module.css'

/**
 * The "→" after a link that leads on, as in *Všechny články →* (design
 * jnd2p832): a text glyph, the counterpart of "‹" in `ParentLink`, never an
 * icon. It is hidden from screen readers, so the link's name is its label, and
 * as an inline-block it takes no underline, so the line ends with the label.
 * The link around it should not wrap.
 *
 * @returns The hidden arrow glyph
 */
export const LinkArrow = () => (
  <span aria-hidden={true} className={styles.arrow}>
    →
  </span>
)
