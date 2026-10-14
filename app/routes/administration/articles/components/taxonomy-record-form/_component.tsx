import { getFormProps } from '@conform-to/react'
import type { ReactNode } from 'react'

import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import type { useTaxonomyRecordForm } from '../../utils/use-taxonomy-record-form'
import styles from './_styles.module.css'

type Props = Pick<
  ReturnType<typeof useTaxonomyRecordForm>,
  'fetcher' | 'form'
> & {
  children: ReactNode
}

/**
 * The form of a category's or tag's add or edit page (design 25c): 480 px
 * wide, sent through the page's fetcher, with the form-level errors above its
 * fields.
 */
export const TaxonomyRecordForm = ({ fetcher, form, children }: Props) => (
  <fetcher.Form className={styles.form} method={'post'} {...getFormProps(form)}>
    <AuthenticityTokenInput />

    {form.errors !== undefined && form.errors.length > 0 && (
      <ErrorMessageGroup>
        {form.errors.map((error) => (
          <ErrorMessage key={error}>{error}</ErrorMessage>
        ))}
      </ErrorMessageGroup>
    )}

    {children}
  </fetcher.Form>
)
