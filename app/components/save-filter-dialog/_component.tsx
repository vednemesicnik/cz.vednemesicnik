import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import type { ReactNode } from 'react'
import { href, useFetcher } from 'react-router'
import { AdminDialog } from '~/components/admin/admin-modal'
import { AdminModalActions } from '~/components/admin/admin-modal-actions'
import { AdminModalContent } from '~/components/admin/admin-modal-content'
import { AdminModalTitle } from '~/components/admin/admin-modal-title'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Checkbox } from '~/components/checkbox'
import { CheckboxHint } from '~/components/checkbox-hint'
import { ErrorMessage } from '~/components/error-message'
import { ErrorMessageGroup } from '~/components/error-message-group'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldLabel } from '~/components/text-field-label'
import { FORM_CONFIG } from '~/config/form-config'
import { useFilterDialog } from '~/hooks/use-filter-dialog'
import { createFilterSchema } from '~/routes/administration/filters/_schema'
import type { FilterActionData } from '~/types/saved-filter'
import type { AdminListTableKey } from '~/utils/admin-list-filters'

import styles from './_styles.module.css'

type Props = {
  currentQuery: string
  onClose: () => void
  tableKey: AdminListTableKey
  defaultHint?: string
  children?: ReactNode
}

/**
 * Saves the list's current state as a named filter.
 *
 * @param props.defaultHint - The hint under Nastavit jako výchozí, in the
 *   list's words; a prop, since the checkbox belongs to the dialog's form.
 * @param props.children - What is saved, a sentence or a list (design 22d),
 *   between the name and the checkboxes.
 */
export const SaveFilterDialog = ({
  currentQuery,
  onClose,
  tableKey,
  defaultHint,
  children,
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
        <AdminModalTitle>Uložit filtry</AdminModalTitle>

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
            id={fields.name.id}
            required={fields.name.required}
          >
            <TextFieldLabel isRequiredMarkHidden>Název</TextFieldLabel>
            <TextFieldControl
              {...getInputProps(fields.name, { type: 'text' })}
            />
          </TextField>

          {children !== undefined && (
            <div className={styles.summary}>{children}</div>
          )}

          <div className={styles.checkboxes}>
            <Checkbox
              {...getInputProps(fields.isDefault, {
                type: 'checkbox',
              })}
            >
              Nastavit jako výchozí
              {defaultHint !== undefined && (
                <CheckboxHint>{defaultHint}</CheckboxHint>
              )}
            </Checkbox>
            <Checkbox
              {...getInputProps(fields.isShared, {
                type: 'checkbox',
              })}
            >
              Sdílet s ostatními
              <CheckboxHint>
                Ostatní ho mohou použít, měnit ho můžete jen vy.
              </CheckboxHint>
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
