// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, useNavigation } from 'react-router'
import { AdminButton } from '~/components/admin-button'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Input } from '~/components/input'
import { Select } from '~/components/select'
import { schema } from './_schema'
import type { Route } from './+types/route'

export default function RouteComponent({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const { memberId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: loaderData.editorialBoardMember.authorId,
      fullName: loaderData.editorialBoardMember.fullName,
      positionIds: loaderData.editorialBoardMember.positions.map(
        (position) => position.id,
      ),
    },
    id: 'edit-member',
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Upravit člena</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <Fieldset
          disabled={isLoadingOrSubmitting}
          legend={'Informace o členovi'}
        >
          <Input
            label={'Celé jméno'}
            {...getInputProps(fields.fullName, { type: 'text' })}
            errors={fields.fullName.errors}
            placeholder={'Jan Novák'}
          />
        </Fieldset>

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Pozice'}>
          <Select
            label={'Pozice'}
            {...getSelectProps(fields.positionIds)}
            errors={fields.positionIds.errors}
            multiple
          >
            {loaderData.editorialBoardMemberPositions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.key}
              </option>
            ))}
          </Select>
        </Fieldset>

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Autor'}>
          <Select
            label={'Autor'}
            {...getSelectProps(fields.authorId)}
            errors={fields.authorId.errors}
          >
            {loaderData.authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.name}
              </option>
            ))}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <AdminButton disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Ukládá se...' : 'Uložit'}
          </AdminButton>
          <AdminLinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/editorial-board/members/:memberId', {
              memberId,
            })}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'
