import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import type { ReactNode } from 'react'
import { href, useFetcher } from 'react-router'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { useFilterDialog } from '~/components/admin/admin-saved-filters/_hook'
import type { FilterActionData } from '~/components/admin/admin-saved-filters/_types'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Checkbox } from '~/components/checkbox'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { TextField } from '~/components/text-field'
import { FORM_CONFIG } from '~/config/form-config'
import { createFilterSchema } from '~/routes/administration/filters/_schema'
import type { AdminListTableKey } from '~/utils/admin-list-filters'

import styles from './_styles.module.css'

type Props = {
  currentQuery: string
  onClose: () => void
  tableKey: AdminListTableKey
  title?: string
  summary?: ReactNode
  defaultHint?: string
  sharedHint?: string
}

/**
 * Saves the list's current state as a named filter.
 *
 * @param props.title - The dialog's title.
 * @param props.summary - What is saved, a sentence or a list (design 22d).
 * @param props.defaultHint - The hint under Nastavit jako výchozí.
 * @param props.sharedHint - The hint under Sdílet s ostatními.
 */
export const SaveFilterDialog = ({
  currentQuery,
  onClose,
  tableKey,
  title = 'Uložit aktuální filtr',
  summary,
  defaultHint,
  sharedHint,
}: Props) => {
  const fetcher = useFetcher<FilterActionData>()
  const dialogRef = useFilterDialog(fetcher, onClose)

  const [form, fields] = useForm({
    constraint: getZodConstraint(createFilterSchema),
    id: 'save-filter',
    lastResult: fetcher.data?.submissionResult,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: createFilterSchema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const handleCancel = () => dialogRef.current?.close()

  return (
    <AdminDialog ref={dialogRef}>
      <AdminModalContent>
        <AdminModalTitle>{title}</AdminModalTitle>

        <fetcher.Form
          action={href('/administration/filters')}
          className={styles.form}
          method={'post'}
          {...getFormProps(form)}
        >
          <AuthenticityTokenInput />
          <input
            name={FORM_CONFIG.intent.name}
            type={'hidden'}
            value={FORM_CONFIG.intent.value.createFilter}
          />
          {/* Plain inputs rather than `getInputProps`: both values are owned by
              the list URL, not by the form, so they must follow the props. */}
          <input name={fields.tableKey.name} type={'hidden'} value={tableKey} />
          <input
            name={fields.query.name}
            type={'hidden'}
            value={currentQuery}
          />

          <TextField
            errors={fields.name.errors}
            label={'Název'}
            {...getInputProps(fields.name, { type: 'text' })}
          />

          {summary !== undefined && (
            <div className={styles.summary}>{summary}</div>
          )}

          <div className={styles.checkboxes}>
            <Checkbox
              hint={defaultHint}
              {...getInputProps(fields.isDefault, {
                type: 'checkbox',
              })}
            >
              Nastavit jako výchozí
            </Checkbox>
            <Checkbox
              hint={sharedHint}
              {...getInputProps(fields.isShared, {
                type: 'checkbox',
              })}
            >
              Sdílet s ostatními
            </Checkbox>
          </div>

          {/* The snapshot is a hidden field, so its errors (an unusable filter)
              would have nowhere to surface; nor would a refused form token. */}
          <ErrorMessageGroup>
            {[...(fields.query.errors ?? []), ...(form.errors ?? [])].map(
              (error) => (
                <ErrorMessage key={error}>{error}</ErrorMessage>
              ),
            )}
          </ErrorMessageGroup>

          <AdminModalActions>
            <Button
              onClick={handleCancel}
              size={'sm'}
              type={'button'}
              variant={'ghost'}
            >
              Zrušit
            </Button>
            <Button
              disabled={fetcher.state !== 'idle'}
              size={'sm'}
              type={'submit'}
            >
              Uložit
            </Button>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
