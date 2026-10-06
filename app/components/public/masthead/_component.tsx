import { Subheadline } from '~/components/subheadline'
import { Wordmark } from '~/components/wordmark'

import styles from './_styles.module.css'

/**
 * The homepage's masthead, like a printed front page: the name as the page's `h1`,
 * turning once per session, with the subtitle under it and a rule below (design
 * 10a, 10b).
 */
export const Masthead = () => {
  return (
    <div className={styles.masthead}>
      <Wordmark animate as={'h1'} className={styles.name} />
      <Subheadline>Studentské nekritické noviny</Subheadline>
    </div>
  )
}
