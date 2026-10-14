import { getFormProps } from '@conform-to/react'

import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { LinkButton } from '~/components/link-button'
import { FORM_CONFIG } from '~/config/form-config'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { useTaxonomyRecordForm } from '../../utils/use-taxonomy-record-form'
import { TaxonomyRecordFields } from '../taxonomy-record-fields'
import styles from './_styles.module.css'

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
 * Adds a category or tag (design 25c, decision 0016): saved as a draft, or at
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
    <fetcher.Form
      className={styles.form}
      method={'post'}
      {...getFormProps(form)}
    >
      <AuthenticityTokenInput />

      {form.errors !== undefined && form.errors.length > 0 && (
        <ErrorMessageGroup>
          {form.errors.map((error) => (
            <ErrorMessage key={error}>{error}</ErrorMessage>
          ))}
        </ErrorMessageGroup>
      )}

      <TaxonomyRecordFields
        authors={authors}
        copy={copy}
        fields={fields}
        followsName={true}
        form={form}
        publishedSlug={null}
        slugSuggestion={slugSuggestion}
      />

      {/* Primary last, as in Dialog; on a phone stacked with it on top (25c). */}
      <div className={styles.actions}>
        <LinkButton
          disabled={isSubmitting}
          onClick={handleCancel}
          replace={true}
          to={parentPath}
          variant={'ghost'}
        >
          Zrušit
        </LinkButton>
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
      </div>
    </fetcher.Form>
  )
}
