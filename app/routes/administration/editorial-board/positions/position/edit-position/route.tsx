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
import { getSchema } from './_schema'
import type { Route } from './+types/route'

export default function RouteComponent({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const { positionId } = params
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(
      getSchema(loaderData.editorialBoardPositionsCount),
    ),
    defaultValue: {
      authorId: loaderData.editorialBoardPosition.authorId,
      currentOrder: loaderData.editorialBoardPosition.order,
      id: loaderData.editorialBoardPosition.id,
      key: loaderData.editorialBoardPosition.key,
      newOrder: loaderData.editorialBoardPosition.order,
      pluralLabel: loaderData.editorialBoardPosition.pluralLabel,
    },
    id: 'edit-position',
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) =>
      parseWithZod(formData, {
        schema: getSchema(loaderData.editorialBoardPositionsCount),
      }),
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
      <AdminHeadline>Upravit pozici</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
        <input {...getInputProps(fields.id, { type: 'hidden' })} />
        <input {...getInputProps(fields.currentOrder, { type: 'hidden' })} />

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Detaily pozice'}>
          <Input
            label={'Unikátní klíč v angličtině'}
            {...getInputProps(fields.key, { type: 'text' })}
            errors={fields.key.errors}
            placeholder={'editor'}
          />

          <Input
            label={'Označení v množném čísle'}
            {...getInputProps(fields.pluralLabel, { type: 'text' })}
            errors={fields.pluralLabel.errors}
            placeholder={'redaktorky a redaktoři'}
          />

          <Input
            label={'Pořadí'}
            {...getInputProps(fields.newOrder, { type: 'number' })}
            errors={fields.newOrder.errors}
            placeholder={'2'}
          />
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
            to={href('/administration/editorial-board/positions/:positionId', {
              positionId,
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
