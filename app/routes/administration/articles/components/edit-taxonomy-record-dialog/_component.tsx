import { getFormProps } from '@conform-to/react'

import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { useTaxonomyRecordDialog } from '../../utils/use-taxonomy-record-dialog'
import { TaxonomyRecordFields } from '../taxonomy-record-fields'
import styles from './_styles.module.css'

type Props = {
  copy: TaxonomyRecordCopy
  authors: { id: string; name: string }[] | null
  defaultValue: { authorId: string; name: string; slug: string }
  publishedSlug: string | null
  parentPath: string
}

/**
 * Edits a category or tag in a dialog over its detail (design 25c, 30a). The
 * address no longer follows the name; a changed address of a draft published
 * before warns that the old one stops working.
 *
 * @param props.authors - For the Coordinator only; `null` hides Autor.
 * @param props.publishedSlug - The address of a draft published before, or
 *   `null`.
 * @param props.parentPath - The detail with its query.
 */
export const EditTaxonomyRecordDialog = ({
  copy,
  authors,
  defaultValue,
  publishedSlug,
  parentPath,
}: Props) => {
  const { close, fetcher, fields, form, isSubmitting, ref, slugSuggestion } =
    useTaxonomyRecordDialog({
      copy,
      defaultValue,
      formId: 'edit-taxonomy-record',
      parentPath,
    })

  return (
    <AdminDialog aria-label={copy.editTitle} ref={ref}>
      <AdminModalContent>
        <AdminModalTitle>{copy.editTitle}</AdminModalTitle>

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
            followsName={false}
            form={form}
            publishedSlug={publishedSlug}
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
            <Button disabled={isSubmitting} size={'sm'} type={'submit'}>
              Uložit
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
