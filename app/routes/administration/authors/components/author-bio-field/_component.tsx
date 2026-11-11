import type { FieldMetadata } from '@conform-to/react'

import { TextareaField } from '~/components/textarea-field'
import { TextareaFieldControl } from '~/components/textarea-field-control'
import { TextareaFieldCounter } from '~/components/textarea-field-counter'
import { TextareaFieldLabel } from '~/components/textarea-field-label'
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
  <TextareaField field={field}>
    <TextareaFieldLabel>
      Bio <span className={styles.optional}>nepovinné</span>
    </TextareaFieldLabel>
    <TextareaFieldControl rows={4} />
    <TextareaFieldCounter>
      {`${field.value?.length ?? 0} / ${AUTHOR_CONFIG.bioMaxLength}`}
    </TextareaFieldCounter>
  </TextareaField>
)
