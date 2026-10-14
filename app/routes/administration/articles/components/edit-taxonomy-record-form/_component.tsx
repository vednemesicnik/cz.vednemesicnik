import { Button } from '~/components/button'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { useTaxonomyRecordForm } from '../../utils/use-taxonomy-record-form'
import { TaxonomyRecordActions } from '../taxonomy-record-actions'
import { TaxonomyRecordFields } from '../taxonomy-record-fields'
import { TaxonomyRecordForm } from '../taxonomy-record-form'

type Props = {
  copy: TaxonomyRecordCopy
  authors: { id: string; name: string }[] | null
  defaultValue: { authorId: string; name: string; slug: string }
  publishedSlug: string | null
  parentPath: string
}

/**
 * Edits a category or tag (design 25c, decision 0016). The address no longer
 * follows the name; a changed address of a draft published before warns that
 * the old one stops working.
 *
 * @param props.authors - For the Coordinator only; `null` hides Autor.
 * @param props.publishedSlug - The address of a draft published before, or
 *   `null`.
 * @param props.parentPath - The detail with its query.
 */
export const EditTaxonomyRecordForm = ({
  copy,
  authors,
  defaultValue,
  publishedSlug,
  parentPath,
}: Props) => {
  const { fetcher, fields, form, handleCancel, isSubmitting, slugSuggestion } =
    useTaxonomyRecordForm({
      copy,
      defaultValue,
      formId: 'edit-taxonomy-record',
      parentPath,
    })

  return (
    <TaxonomyRecordForm fetcher={fetcher} form={form}>
      <TaxonomyRecordFields
        authors={authors}
        copy={copy}
        fields={fields}
        followsName={false}
        form={form}
        publishedSlug={publishedSlug}
        slugSuggestion={slugSuggestion}
      />

      <TaxonomyRecordActions
        cancelPath={parentPath}
        disabled={isSubmitting}
        onCancel={handleCancel}
      >
        <Button disabled={isSubmitting} type={'submit'}>
          Uložit
        </Button>
      </TaxonomyRecordActions>
    </TaxonomyRecordForm>
  )
}
