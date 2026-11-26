import { Button } from '~/components/button'
import { RecordForm } from '~/components/record-form'
import { RecordFormActions } from '~/components/record-form-actions'
import { FORM_CONFIG } from '~/config/form-config'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { useTaxonomyRecordForm } from '../../utils/use-taxonomy-record-form'
import { TaxonomyRecordFields } from '../taxonomy-record-fields'

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

type Props = {
  copy: TaxonomyRecordCopy
  authors: { id: string; name: string }[] | null
  selfAuthorId: string
  primaryIntent:
    | typeof INTENT_VALUE.publish
    | typeof INTENT_VALUE.submitForReview
  parentPath: string
}

/**
 * Adds a category or tag (design 25c, log 0016): saved as a draft, or at
 * once published by the Coordinator or submitted for review by anyone else
 * (07c). Publishing is not confirmed: a new record has no articles, so the
 * website does not change (39aqwklv).
 *
 * @param props.authors - For the Coordinator only; `null` hides Autor.
 * @param props.primaryIntent - The role's primary action.
 * @param props.parentPath - The list with its query.
 */
export const NewTaxonomyRecordForm = ({
  copy,
  authors,
  selfAuthorId,
  primaryIntent,
  parentPath,
}: Props) => {
  const { fetcher, fields, form, handleCancel, isSubmitting, slugSuggestion } =
    useTaxonomyRecordForm({
      copy,
      defaultValue: { authorId: selfAuthorId, name: '', slug: '' },
      formId: 'new-taxonomy-record',
      parentPath,
    })

  return (
    <RecordForm fetcher={fetcher} form={form}>
      <TaxonomyRecordFields
        authors={authors}
        copy={copy}
        fields={fields}
        followsName={true}
        form={form}
        publishedSlug={null}
        slugSuggestion={slugSuggestion}
      />

      <RecordFormActions
        cancelPath={parentPath}
        disabled={isSubmitting}
        onCancel={handleCancel}
      >
        <Button
          disabled={isSubmitting}
          name={INTENT_NAME}
          type={'submit'}
          value={INTENT_VALUE.saveDraft}
          variant={'outline'}
        >
          Uložit koncept
        </Button>
        <Button
          disabled={isSubmitting}
          name={INTENT_NAME}
          type={'submit'}
          value={primaryIntent}
        >
          {primaryIntent === INTENT_VALUE.publish
            ? 'Publikovat'
            : 'Odeslat ke schválení'}
        </Button>
      </RecordFormActions>
    </RecordForm>
  )
}
