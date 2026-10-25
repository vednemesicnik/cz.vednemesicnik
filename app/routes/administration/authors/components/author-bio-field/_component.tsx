import type { FieldMetadata } from '@conform-to/react'

import { AdminTextarea } from '~/components/admin/admin-textarea'
import { AUTHOR_CONFIG } from '~/config/author-config'
import styles from './_styles.module.css'

type Props = {
  field: FieldMetadata<string | undefined>
}

/**
 * Bio on Nový autor and Upravit autora (design 28c): optional, no
 * placeholder, its length against the limit at the end of the row.
 */
export const AuthorBioField = ({ field }: Props) => (
  <AdminTextarea
    counter={`${field.value?.length ?? 0} / ${AUTHOR_CONFIG.bioMaxLength}`}
    field={field}
    label={
      <>
        Bio <span className={styles.optional}>nepovinné</span>
      </>
    }
    textareaProps={{ rows: 4 }}
  />
)
