import { OpenInNewIcon } from '~/components/icons/open-in-new-icon'

import styles from './_styles.module.css'

/**
 * The footer under the content of every signed-in administration page (design 22a,
 * tyxr2jqk): one link to the website's front page, opening a new tab.
 */
export const AdministrationPageFooter = () => {
  return (
    <footer className={styles.footer}>
      <a className={styles.link} href={'/'} rel={'noopener'} target={'_blank'}>
        Zobrazit web
        <span className={styles.icon}>
          <OpenInNewIcon decorative />
        </span>
        <span className={'screen-reader-only'}>
          {' '}
          (otevře se v nové záložce)
        </span>
      </a>
    </footer>
  )
}
