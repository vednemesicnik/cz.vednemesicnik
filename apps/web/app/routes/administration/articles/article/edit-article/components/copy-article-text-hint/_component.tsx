import styles from './_styles.module.css'

/**
 * What *Zkopírovat celý text* leaves out (design 24h, copy zqe81r3k): an
 * unsaved title or perex cannot be rescued, and the editor does not promise it.
 */
export const CopyArticleTextHint = () => (
  <span className={styles.hint}>
    Kopie obsahuje jen text článku, bez názvu, perexu a ostatních údajů.
  </span>
)
