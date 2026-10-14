import { getFormProps } from '@conform-to/react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { FORM_CONFIG } from '~/config/form-config'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { useTaxonomyRecordDialog } from '../../utils/use-taxonomy-record-dialog'
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
 * Adds a category or tag in a dialog over the list (design 25c, 30a): saved
 * as a draft, or at once published by the Coordinator or submitted for review
 * by anyone else (07c). Publishing is not confirmed: a new record has no
 * articles, so the website does not change (39aqwklv).
 *
 * @param props.authors - For the Coordinator only; `null` hides Autor.
 * @param props.primaryIntent - The role's primary action.
 * @param props.parentPath - The list with its query.
 */
export const NewTaxonomyRecordDialog = ({
  copy,
  authors,
  selfAuthorId,
  primaryIntent,
  parentPath,
}: Props) => {
  const { close, fetcher, fields, form, isSubmitting, ref, slugSuggestion } =
    useTaxonomyRecordDialog({
      copy,
      defaultValue: { authorId: selfAuthorId, name: '', slug: '' },
      formId: 'new-taxonomy-record',
      parentPath,
    })

  return (
    <AdminDialog aria-label={copy.newTitle} ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{copy.newTitle}</AdminModalTitle>

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

          <AdminModalActions>
            <Button
              disabled={isSubmitting}
              onClick={close}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zrušit
            </Button>
            <Button
              disabled={isSubmitting}
              name={INTENT_NAME}
              size={'sm'}
              type={'submit'}
              value={INTENT_VALUE.saveDraft}
              variant={'outline'}
            >
              Uložit koncept
            </Button>
            <Button
              disabled={isSubmitting}
              name={INTENT_NAME}
              size={'sm'}
              type={'submit'}
              value={primaryIntent}
            >
              {primaryIntent === INTENT_VALUE.publish
                ? 'Publikovat'
                : 'Odeslat ke schválení'}
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
