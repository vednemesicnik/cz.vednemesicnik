import type { ReactNode } from 'react'

import styles from './_styles.module.css'

type Props = {
  /** The toolbar's name, e.g. *Formát: Text*. */
  label: string
  children: ReactNode
}

/**
 * The toolbar over `TextEditor`'s text (design 24a): groups of
 * `TextEditorToolbarButton`s in a row that stays at the top of the field while
 * the text scrolls, and scrolls sideways on a phone (24f).
 */
export const TextEditorToolbar = ({ label, children }: Props) => (
  <div aria-label={label} className={styles.toolbar} role={'toolbar'}>
    {children}
  </div>
)
