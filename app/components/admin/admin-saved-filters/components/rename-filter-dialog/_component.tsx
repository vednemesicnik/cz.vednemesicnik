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
import type {
  FilterActionData,
  OwnFilter,
} from '~/components/admin/admin-saved-filters/_types'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { FORM_CONFIG } from '~/config/form-config'
import { renameFilterSchema } from '~/routes/administration/filters/_schema'

import styles from './_styles.module.css'

type Props = {
  filter: OwnFilter
  onClose: () => void
}

export const RenameFilterDialog = ({ filter, onClose }: Props) => {
  const fetcher = useFetcher<FilterActionData>()
  const dialogRef = useFilterDialog(fetcher, onClose)

  const [form, fields] = useForm({
    constraint: getZodConstraint(renameFilterSchema),
    defaultValue: { id: filter.id, name: filter.name },
    id: `rename-filter-${filter.id}`,
    lastResult: fetcher.data?.submissionResult,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: renameFilterSchema }),
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
        <AdminModalTitle>Přejmenovat filtr</AdminModalTitle>

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
            value={FORM_CONFIG.intent.value.renameFilter}
          />
          <input {...getInputProps(fields.id, { type: 'hidden' })} />

          <AdminInput
            errors={fields.name.errors}
            label={'Název'}
            {...getInputProps(fields.name, { type: 'text' })}
          />

          <AdminModalActions>
            <AdminButton
              onClick={handleCancel}
              type={'button'}
              variant={'secondary'}
            >
              Zrušit
            </AdminButton>
            <AdminButton disabled={fetcher.state !== 'idle'} type={'submit'}>
              Přejmenovat
            </AdminButton>
          </AdminModalActions>
        </fetcher.Form>
      </AdminModalContent>
    </AdminDialog>
  )
}
