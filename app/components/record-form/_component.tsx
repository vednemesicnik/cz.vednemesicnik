import { type FormMetadata, getFormProps } from '@conform-to/react'
import type { ReactNode } from 'react'
import type { FetcherWithComponents } from 'react-router'

import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import styles from './_styles.module.css'

type Props<Schema extends Record<string, unknown>> = {
  fetcher: Pick<FetcherWithComponents<unknown>, 'Form'>
  form: FormMetadata<Schema, string[]>
  children: ReactNode
}

/**
 * The form of a record's add or edit page (design 25c, 28c): 480 px wide,
 * sent through the page's fetcher, with the form-level errors above its
 * fields.
 */
export const RecordForm = <Schema extends Record<string, unknown>>({
  fetcher,
  form,
  children,
}: Props<Schema>) => (
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
