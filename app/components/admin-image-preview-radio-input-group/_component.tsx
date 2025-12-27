import type { ComponentProps } from 'react'
import { AdminImagePreviewCard } from '~/components/admin-image-preview-card'
import { AdminRadioInputBase } from '~/components/admin-radio-input-base'
import styles from './_styles.module.css'

type Props = {
  onDelete: (index: number) => void
  previews: string[]
} & Pick<ComponentProps<'input'>, 'form' | 'name'>

export const AdminImagePreviewRadioInputGroup = ({
  onDelete,
  previews,
  name,
  form,
}: Props) => {
  if (previews.length === 0) {
    return null
  }

  return (
    <section className={styles.previewSection}>
      <AdminRadioInputBase
        defaultChecked={true}
        form={form}
        label={'Bez hlavního obrázku'}
        name={name}
        value={''}
      />
      <section className={styles.previewGrid}>
        {previews.map((previewUrl, index) => (
          <AdminImagePreviewCard
            alt={`Náhled ${index + 1}`}
            key={previewUrl}
            onDelete={() => onDelete(index)}
            previewUrl={previewUrl}
          >
            <AdminRadioInputBase
              form={form}
              label={'Hlavní obrázek'}
              name={name}
              value={index}
            />
          </AdminImagePreviewCard>
        ))}
      </section>
    </section>
  )
}
