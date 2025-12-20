import { BaseLink } from '~/components/base-link'
import { VdmLogo } from '~/components/vdm-logo'

import styles from './_styles.module.css'

type Props = {
  children?: never
  isInEditMode: boolean
}

export const HomeLink = ({ isInEditMode }: Props) => {
  return (
    <BaseLink className={styles.link} to={'/'}>
      <VdmLogo
        className={styles.logo}
        variant={isInEditMode ? 'editMode' : 'default'}
      />
      <h1 className={styles.name}>Vedneměsíčník</h1>
    </BaseLink>
  )
}
