// noinspection JSUnusedGlobalSymbols

import { getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useState } from 'react'
import { href, useFetcher, useNavigation } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import { Button } from '~/components/button'
import { Checkbox } from '~/components/checkbox'
import { CheckboxHint } from '~/components/checkbox-hint'
import { FormLegend } from '~/components/form-legend'
import { PageTitle } from '~/components/page-title'
import { Radio } from '~/components/radio'
import { RadioGroup } from '~/components/radio-group'
import { RadioGroupLegend } from '~/components/radio-group-legend'
import { RadioHint } from '~/components/radio-hint'
import { RecordForm } from '~/components/record-form'
import { RecordFormActions } from '~/components/record-form-actions'
import { TextField } from '~/components/text-field'
import { TextFieldControl } from '~/components/text-field-control'
import { TextFieldHint } from '~/components/text-field-hint'
import { TextFieldLabel } from '~/components/text-field-label'
import { getAuthorRoleDescription } from '~/utils/get-author-role-description'
import { getAuthorRoleLabel } from '~/utils/role-labels'
import { useReturnToOpener } from '~/utils/use-return-to-opener'
import { AUTHOR_RECORD_COPY } from '../../authors/author-record-copy'
import { USER_RECORD_COPY } from '../user-record-copy'
import type { action } from './_action'
import { schema } from './_schema'
import type { Route } from './+types/route'
import { ExistingAuthorField } from './components/existing-author-field'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

type AuthorMode = 'new' | 'existing'

/**
 * Nový uživatel (design 28f): the author first — a new one with its name and
 * author role, or an existing one without an account — then the e-mail the
 * invitation goes to and whether the account manages users and authors.
 * Vytvořit a pozvat lands on the new user's detail with the invitation's
 * result (28e).
 */
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const {
    authorRoles,
    authorsWithoutUser,
    defaultAuthorRoleId,
    preselectedAuthorId,
  } = loaderData
  const navigation = useNavigation()
  const fetcher = useFetcher<typeof action>()
  const { handleCancel } = useReturnToOpener(href('/administration/users'))
  const [authorMode, setAuthorMode] = useState<AuthorMode>(
    preselectedAuthorId === null ? 'new' : 'existing',
  )

  const lastResult =
    fetcher.data !== undefined && 'submissionResult' in fetcher.data
      ? fetcher.data.submissionResult
      : undefined

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorMode: preselectedAuthorId === null ? 'new' : 'existing',
      authorRoleId: defaultAuthorRoleId,
    },
    id: 'new-user',
    lastResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldRevalidate: 'onBlur',
    // The e-mail's domain and @ show as the field is left (cdwzh02a).
    shouldValidate: 'onBlur',
  })

  // Sent, and on the way to the new user's detail.
  const isSubmitting = fetcher.state !== 'idle' || navigation.state !== 'idle'

  const authorModeProps = (value: AuthorMode) => ({
    ...getInputProps(fields.authorMode, { type: 'radio', value }),
    id: `${fields.authorMode.id}-${value}`,
    onChange: () => setAuthorMode(value),
  })

  return (
    <AdminPage measure={'form'}>
      <PageTitle>{USER_RECORD_COPY.newTitle}</PageTitle>

      <RecordForm fetcher={fetcher} form={form}>
        <FormLegend />

        <RadioGroup>
          <RadioGroupLegend>{USER_RECORD_COPY.author.legend}</RadioGroupLegend>
          <Radio {...authorModeProps('new')}>
            {USER_RECORD_COPY.author.new}
          </Radio>
          <Radio {...authorModeProps('existing')}>
            {USER_RECORD_COPY.author.existing}
          </Radio>
          {authorMode === 'existing' && (
            <ExistingAuthorField
              authors={authorsWithoutUser}
              defaultAuthorId={preselectedAuthorId}
              errorId={fields.existingAuthorId.errorId}
              errors={fields.existingAuthorId.errors}
              id={fields.existingAuthorId.id}
              name={fields.existingAuthorId.name}
            />
          )}
        </RadioGroup>

        {authorMode === 'new' && (
          <>
            <TextField
              errors={fields.name.errors}
              id={fields.name.id}
              // Required for a new author only, which the union's constraint
              // can't say.
              required
            >
              <TextFieldLabel>Jméno</TextFieldLabel>
              <TextFieldControl
                {...getInputProps(fields.name, { type: 'text' })}
              />
              <TextFieldHint>{AUTHOR_RECORD_COPY.nameHint}</TextFieldHint>
            </TextField>

            <RadioGroup>
              <RadioGroupLegend>
                {AUTHOR_RECORD_COPY.roleLegend}
              </RadioGroupLegend>
              {authorRoles.map((role) => (
                <Radio
                  {...getInputProps(fields.authorRoleId, {
                    type: 'radio',
                    value: role.id,
                  })}
                  id={`${fields.authorRoleId.id}-${role.name}`}
                  key={role.id}
                >
                  {getAuthorRoleLabel(role.name)}
                  <RadioHint>{getAuthorRoleDescription(role.name)}</RadioHint>
                </Radio>
              ))}
            </RadioGroup>
          </>
        )}

        <TextField
          errors={fields.email.errors}
          id={fields.email.id}
          required={fields.email.required}
        >
          <TextFieldLabel>E-mail</TextFieldLabel>
          <TextFieldControl
            {...getInputProps(fields.email, { type: 'email' })}
          />
          <TextFieldHint>{USER_RECORD_COPY.emailHint}</TextFieldHint>
        </TextField>

        <Checkbox
          {...getInputProps(fields.isAdministrator, { type: 'checkbox' })}
        >
          {USER_RECORD_COPY.administrator.label}
          <CheckboxHint>{USER_RECORD_COPY.administrator.hint}</CheckboxHint>
        </Checkbox>

        <RecordFormActions
          cancelPath={href('/administration/users')}
          disabled={isSubmitting}
          onCancel={handleCancel}
        >
          {/* Creates the account and sends the invitation (design 28f). */}
          <Button disabled={isSubmitting} type={'submit'}>
            {isSubmitting ? 'Čekejte prosím…' : 'Vytvořit a pozvat'}
          </Button>
        </RecordFormActions>
      </RecordForm>
    </AdminPage>
  )
}
