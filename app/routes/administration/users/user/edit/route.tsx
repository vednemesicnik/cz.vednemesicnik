// noinspection JSUnusedGlobalSymbols

import { getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef, useState } from 'react'
import { href, useFetcher, useNavigation } from 'react-router'
import type { z } from 'zod'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { Checkbox } from '~/components/checkbox'
import { Link } from '~/components/link'
import { PageTitle } from '~/components/page-title'
import { RecordForm } from '~/components/record-form'
import { RecordFormActions } from '~/components/record-form-actions'
import { TextField } from '~/components/text-field'
import { useToast } from '~/components/toast-provider'
import { hasEmailChanged } from '~/utils/has-email-changed'
import { useReturnToOpener } from '~/utils/use-return-to-opener'
import { USER_RECORD_COPY } from '../../user-record-copy'
import type { action } from './_action'
import { schema } from './_schema'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { RemoveOwnAdministrationDialog } from './components/remove-own-administration-dialog'
import { isRemovingOwnAdministration } from './utils/is-removing-own-administration'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

/**
 * Upravit uživatele (design 28f): the e-mail and whether the account manages
 * users and authors; name and author role belong to the author. Ticking the
 * box says what it gives; unticking it on one's own account asks first (28g),
 * and then lands on Přehled. The role keeps a version: changed meanwhile, it
 * is not overwritten, the box shows the current state and a note above the
 * buttons says so; the e-mail is saved (lj22mnbm). The Owner's edit has no
 * box (log 0003).
 */
export default function RouteComponent({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { isOwnAccount, isOwner, user } = loaderData
  const navigation = useNavigation()
  const showToast = useToast()
  const fetcher = useFetcher<typeof action>()
  const detailPath = href('/administration/users/:userId', {
    userId: params.userId,
  })
  const { handleCancel, leave } = useReturnToOpener(detailPath)
  // The role the save is checked against; a collision moves it to the
  // current one, a revalidation of the page does not.
  const [loadedRole, setLoadedRole] = useState({
    id: user.role.id,
    isAdministrator: user.role.name === 'administrator',
  })
  const [isConfirmingRemoval, setIsConfirmingRemoval] = useState(false)

  const lastResult =
    fetcher.data !== undefined && 'submissionResult' in fetcher.data
      ? fetcher.data.submissionResult
      : undefined

  const [form, fields] = useForm<z.infer<typeof schema>>({
    constraint: getZodConstraint(schema),
    defaultValue: {
      email: user.email,
      isAdministrator: user.role.name === 'administrator',
      // The Owner's form sends no role (log 0003).
      loadedRoleId: isOwner ? undefined : user.role.id,
    },
    id: 'edit-user',
    lastResult,
    // Unticking one's own administration waits for the dialog (28g).
    onSubmit: (event, { formData }) => {
      if (
        isRemovingOwnAdministration({
          isAdministratorChecked: formData.get('isAdministrator') === 'on',
          isLoadedAdministrator: loadedRole.isAdministrator,
          isOwnAccount,
        })
      ) {
        event.preventDefault()
        setIsConfirmingRemoval(true)
      }
    },
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldRevalidate: 'onBlur',
    // The domain and the @ show as the field is left; a taken address after
    // Save (design 28f).
    shouldValidate: 'onBlur',
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
      setLoadedRole({
        id: result.currentRoleId,
        isAdministrator: result.isAdministrator,
      })
      form.update({
        name: fields.isAdministrator.name,
        value: result.isAdministrator,
      })
      return
    }

    showToast(USER_RECORD_COPY.toasts.saved)
    leave()
  })

  const roleConflict =
    fetcher.data !== undefined &&
    'status' in fetcher.data &&
    fetcher.data.status === 'role-conflict'
      ? fetcher.data
      : null

  const isGainingAdministration =
    fields.isAdministrator.value === 'on' && !loadedRole.isAdministrator
  const isEmailChanged = hasEmailChanged(user.email, fields.email.value)

  // Saved and leaving: the page stays until the next one loads, and a second
  // click must not send the form again.
  const isSubmitting =
    fetcher.state !== 'idle' ||
    navigation.state !== 'idle' ||
    (fetcher.data !== undefined &&
      'status' in fetcher.data &&
      fetcher.data.status === 'success')

  const submitForm = () => {
    const formElement = document.getElementById(form.id)

    if (formElement instanceof HTMLFormElement) {
      fetcher.submit(formElement)
    }
  }

  return (
    <AdminPage measure={'form'}>
      <PageTitle>{USER_RECORD_COPY.editTitle}</PageTitle>

      <RecordForm fetcher={fetcher} form={form}>
        <TextField
          label={'E-mail'}
          {...getInputProps(fields.email, { type: 'email' })}
          errors={fields.email.errors}
        />

        {!isOwner && (
          <>
            <Checkbox
              {...getInputProps(fields.isAdministrator, { type: 'checkbox' })}
              hint={USER_RECORD_COPY.administrator.hint}
            >
              {USER_RECORD_COPY.administrator.label}
            </Checkbox>

            {isGainingAdministration && (
              <Callout className={styles.callout} tone={'warning'}>
                {USER_RECORD_COPY.administrator.warning}
              </Callout>
            )}

            <input
              name={fields.loadedRoleId.name}
              type={'hidden'}
              value={loadedRole.id}
            />
          </>
        )}

        <AdminParagraph>
          Jméno a autorskou roli upravíte v detailu autora:{' '}
          <Link
            to={href('/administration/authors/:authorId', {
              authorId: user.author.id,
            })}
          >
            {user.author.name}
          </Link>
          .
        </AdminParagraph>

        {isEmailChanged && (
          <Callout className={styles.callout} tone={'warning'}>
            K přihlášení e-mailem bude sloužit nová adresa. Na původní adresu
            přijde oznámení o změně.
          </Callout>
        )}

        {roleConflict !== null && (
          <Callout className={styles.callout} role={'alert'} tone={'error'}>
            <span className={styles.lines}>
              <span>{USER_RECORD_COPY.roleConflict}</span>
              {roleConflict.roleChange !== null && (
                <span>
                  {USER_RECORD_COPY.roleConflictChange(
                    roleConflict.roleChange.actorName,
                    roleConflict.roleChange.changedAt,
                  )}
                </span>
              )}
            </span>
          </Callout>
        )}

        <RecordFormActions
          cancelPath={detailPath}
          disabled={isSubmitting}
          onCancel={handleCancel}
        >
          <Button disabled={isSubmitting} type={'submit'}>
            Uložit
          </Button>
        </RecordFormActions>
      </RecordForm>

      {isConfirmingRemoval && (
        <RemoveOwnAdministrationDialog
          onClose={() => setIsConfirmingRemoval(false)}
          onConfirm={submitForm}
        />
      )}
    </AdminPage>
  )
}
