import type { ReactNode } from 'react'
import { AdminRadioInputBase } from '~/components/admin-radio-input-base'
import { FEATURED_IMAGE_SOURCE } from '~/config/featured-image-config'
import styles from './_styles.module.css'

type Props = {
  children: ReactNode
  name: string
  form: string
}

export const AdminImagePreviewRadioInputGroup = ({
  form,
  name,
  children,
}: Props) => {
  return (
    <section className={styles.previewSection}>
      <AdminRadioInputBase
        defaultChecked={true}
        form={form}
        label={'Bez hlavního obrázku'}
        name={name}
        value={FEATURED_IMAGE_SOURCE.NONE}
      />
      <section className={styles.previewGrid}>{children}</section>
    </section>
  )
}
