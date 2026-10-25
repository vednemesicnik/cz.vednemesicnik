// noinspection JSUnusedGlobalSymbols

import { getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef, useState } from 'react'
import { href, useFetcher, useNavigation } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { PageTitle } from '~/components/page-title'
import { Radio } from '~/components/radio'
import { RadioGroup } from '~/components/radio-group'
import { RecordForm } from '~/components/record-form'
import { RecordFormActions } from '~/components/record-form-actions'
import { TextField } from '~/components/text-field'
import { useToast } from '~/components/toast-provider'
import { getAuthorRoleLabel } from '~/utils/role-labels'
import { useReturnToOpener } from '~/utils/use-return-to-opener'
import { AUTHOR_RECORD_COPY } from '../../author-record-copy'
import { AuthorBioField } from '../../components/author-bio-field'
import { editAuthorRecordSchema } from '../../utils/author-record-schema'
import { getAuthorRoleChangeWarning } from '../../utils/get-author-role-change-warning'
import type { action } from './_action'
import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

/**
 * Upravit autora (design 28c): name, author role and bio. A role change says
 * what it takes away or gives under the choice and saves without a confirm.
 * The role keeps a version: changed meanwhile, it is not overwritten, the
 * choice shows the current role and a note above the buttons says so; name
 * and bio are saved (lj22mnbm).
 */
export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { author, roles } = loaderData
  const navigation = useNavigation()
  const showToast = useToast()
  const fetcher = useFetcher<typeof action>()
  const { handleCancel, leave } = useReturnToOpener(
    href('/administration/authors/:authorId', { authorId: params.authorId }),
  )
  // The role the save is checked against; a collision moves it to the
  // current one, a revalidation of the page does not.
  const [loadedRoleId, setLoadedRoleId] = useState(author.role.id)

  const lastResult =
    fetcher.data !== undefined && 'submissionResult' in fetcher.data
      ? fetcher.data.submissionResult
      : undefined

  const [form, fields] = useForm({
    constraint: getZodConstraint(editAuthorRecordSchema),
    defaultValue: {
      bio: author.bio ?? '',
      loadedRoleId: author.role.id,
      name: author.name,
      roleId: author.role.id,
    },
    id: 'edit-author',
    lastResult,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: editAuthorRecordSchema }),
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const handledDataRef = useRef(fetcher.data)

  useEffect(() => {
    const result = fetcher.data

    if (
      fetcher.state !== 'idle' ||
      result === undefined ||
      result === handledDataRef.current ||
      !('status' in result)
    ) {
      return
    }
    handledDataRef.current = result

    if (result.status === 'role-conflict') {
      setLoadedRoleId(result.currentRoleId)
      form.update({ name: fields.roleId.name, value: result.currentRoleId })
      return
    }

    showToast(AUTHOR_RECORD_COPY.toasts.saved)
    leave()
  })

  const roleConflict =
    fetcher.data !== undefined &&
    'status' in fetcher.data &&
    fetcher.data.status === 'role-conflict'
      ? fetcher.data
      : null

  const getRoleName = (roleId: string | undefined) =>
    roles.find((role) => role.id === roleId)?.name
  const loadedRoleName = getRoleName(loadedRoleId)
  const chosenRoleName = getRoleName(fields.roleId.value)
  const roleWarning =
    loadedRoleName === undefined || chosenRoleName === undefined
      ? null
      : getAuthorRoleChangeWarning(loadedRoleName, chosenRoleName)

  // Saved and leaving: the page stays until the next one loads, and a second
  // click must not send the form again.
  const isSubmitting =
    fetcher.state !== 'idle' ||
    navigation.state !== 'idle' ||
    (fetcher.data !== undefined &&
      'status' in fetcher.data &&
      fetcher.data.status === 'success')

  return (
    <AdminPage measure={'form'}>
      <PageTitle>{AUTHOR_RECORD_COPY.editTitle}</PageTitle>

      <RecordForm fetcher={fetcher} form={form}>
        <TextField
          label={'Jméno'}
          {...getInputProps(fields.name, { type: 'text' })}
          errors={fields.name.errors}
        />

        <RadioGroup legend={AUTHOR_RECORD_COPY.roleLegend}>
          {roles.map((role) => (
            <Radio
              {...getInputProps(fields.roleId, {
                type: 'radio',
                value: role.id,
              })}
              id={`${fields.roleId.id}-${role.name}`}
              key={role.id}
            >
              {getAuthorRoleLabel(role.name)}
            </Radio>
          ))}
          {roleWarning !== null && (
            <Callout className={styles.callout} tone={'warning'}>
              {roleWarning}
            </Callout>
          )}
        </RadioGroup>

        <AuthorBioField field={fields.bio} />

        <input
          name={fields.loadedRoleId.name}
          type={'hidden'}
          value={loadedRoleId}
        />

        {roleConflict !== null && (
          <Callout className={styles.callout} role={'alert'} tone={'error'}>
            <span className={styles.lines}>
              <span>{AUTHOR_RECORD_COPY.roleConflict}</span>
              {roleConflict.roleChange !== null && (
                <span>
                  {AUTHOR_RECORD_COPY.roleConflictChange(
                    roleConflict.roleChange.actorName,
                    roleConflict.roleChange.changedAt,
                  )}
                </span>
              )}
            </span>
          </Callout>
        )}

        <RecordFormActions
          cancelPath={href('/administration/authors/:authorId', {
            authorId: params.authorId,
          })}
          disabled={isSubmitting}
          onCancel={handleCancel}
        >
          <Button disabled={isSubmitting} type={'submit'}>
            Uložit
          </Button>
        </RecordFormActions>
      </RecordForm>
    </AdminPage>
  )
}
