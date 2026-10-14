import { getFormProps } from '@conform-to/react'

import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { LinkButton } from '~/components/link-button'
import type { TaxonomyRecordCopy } from '../../utils/taxonomy-record-copy'
import { useTaxonomyRecordForm } from '../../utils/use-taxonomy-record-form'
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
        <Button disabled={isSubmitting} type={'submit'}>
          Uložit
        </Button>
      </div>
    </fetcher.Form>
  )
}
