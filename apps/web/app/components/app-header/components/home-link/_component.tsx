import { BaseLink } from '~/components/base-link'
import { VdmLogo } from '~/components/vdm-logo'

import styles from './_styles.module.css'

export const HomeLink = () => {
  return (
    <BaseLink className={styles.link} to={'/'}>
      <VdmLogo className={styles.logo} />
      <span className={'screen-reader-only'}>Vedneměsíčník</span>
    </BaseLink>
  )
}
