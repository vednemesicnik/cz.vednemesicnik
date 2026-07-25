import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, useFetcher } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminInput } from '~/components/admin/admin-input'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { useFilterDialog } from '~/components/admin/admin-saved-filters/_hook'
import type { FilterActionData } from '~/components/admin/admin-saved-filters/_types'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { Label } from '~/components/label'
import { FORM_CONFIG } from '~/config/form-config'
import { createFilterSchema } from '~/routes/administration/filters/_schema'
import type { AdminListTableKey } from '~/utils/admin-list-filters'

import styles from './_styles.module.css'

type Props = {
  currentQuery: string
  onClose: () => void
  tableKey: AdminListTableKey
}

export const SaveFilterDialog = ({
  currentQuery,
  onClose,
  tableKey,
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
        <AdminModalTitle>Uložit aktuální filtr</AdminModalTitle>

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

          <AdminInput
            errors={fields.name.errors}
            label={'Název'}
            {...getInputProps(fields.name, { type: 'text' })}
          />

          <div className={styles.checkboxes}>
            <div className={styles.checkbox}>
              <input
                {...getInputProps(fields.isDefault, {
                  type: 'checkbox',
                })}
              />
              <Label htmlFor={fields.isDefault.id}>Nastavit jako výchozí</Label>
            </div>
            <div className={styles.checkbox}>
              <input
                {...getInputProps(fields.isShared, {
                  type: 'checkbox',
                })}
              />
              <Label htmlFor={fields.isShared.id}>Sdílet s ostatními</Label>
            </div>
          </div>

          {/* The snapshot is a hidden field, so its errors (an unusable filter)
              would have nowhere to surface. */}
          <ErrorMessageGroup>
            {fields.query.errors?.map((error) => (
              <ErrorMessage key={error}>{error}</ErrorMessage>
            ))}
          </ErrorMessageGroup>

          <AdminModalActions>
            <AdminButton
              onClick={handleCancel}
              type={'button'}
              variant={'secondary'}
            >
              Zrušit
            </AdminButton>
            <AdminButton disabled={fetcher.state !== 'idle'} type={'submit'}>
              Uložit
            </AdminButton>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
