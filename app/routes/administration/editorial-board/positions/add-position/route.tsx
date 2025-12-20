// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { useNavigation } from 'react-router'

import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
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
}: Route.ComponentProps) {
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(
      getSchema(loaderData.editorialBoardPositionsCount),
    ),
    defaultValue: {
      authorId: loaderData.selfAuthorId,
      key: '',
      order: '',
      pluralLabel: '',
    },
    id: 'add-position',
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
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Přidat pozici</AdminHeadline>

      <Form method="post" {...getFormProps(form)}>
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
            {...getInputProps(fields.order, { type: 'number' })}
            errors={fields.order.errors}
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
          <Button disabled={!canSubmit} type="submit" variant={'primary'}>
            Přidat
          </Button>
          <AdminLinkButton to={'/administration/editorial-board/positions'}>
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
