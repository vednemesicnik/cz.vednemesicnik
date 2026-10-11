import { Hyperlink } from '~/components/hyperlink'

import styles from './_styles.module.css'

/**
 * The footer under the content of every signed-in administration page (design 22a,
 * tyxr2jqk): one link to the website's front page, opening a new tab.
 */
export const AdministrationPageFooter = () => {
  return (
    <footer className={styles.footer}>
      <Hyperlink className={styles.link} href={'/'}>
        Zobrazit web
      </Hyperlink>
    </footer>
  )
}
