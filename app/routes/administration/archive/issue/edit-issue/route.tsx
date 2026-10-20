// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { href, useNavigation } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Fieldset } from '~/components/fieldset'
import { FileInput } from '~/components/file-input'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { LinkButton } from '~/components/link-button'
import { PageTitle } from '~/components/page-title'
import { Select } from '~/components/select'
import { TextField } from '~/components/text-field'
import { schema } from './_schema'
import type { Route } from './+types/route'

export default function RouteComponent({
  loaderData,
  actionData,
  params,
}: Route.ComponentProps) {
  const { issueId } = params
  const { issue } = loaderData
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: issue.author.id,
      coverId: issue.cover?.id,
      id: issue.id,
      name: issue.name ?? '',
      order: issue.order,
      pdfId: issue.pdf?.id,
      supplement: issue.supplement ?? '',
      year: issue.year,
    },
    id: 'edit-archived-issue-form',
    lastResult: actionData?.submissionResult,
    onValidate: ({ formData }) => parseWithZod(formData, { schema }),
    shouldDirtyConsider: (field) => {
      return !field.startsWith('csrf')
    },
    shouldRevalidate: 'onBlur',
    shouldValidate: 'onSubmit',
  })

  const handleFileChange = (name: string, dirty: boolean) => () => {
    if (dirty) {
      form.validate({ name })
    }
  }

  const isLoadingOrSubmitting = state !== 'idle'
  const isSubmitting = state === 'submitting'
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <PageTitle>Upravit číslo ({issue.title})</PageTitle>
      <Form
        {...getFormProps(form)}
        encType={'multipart/form-data'}
        errors={form.errors}
        method={'post'}
      >
        <input {...getInputProps(fields.id, { type: 'hidden' })} />

        <Fieldset
          disabled={isLoadingOrSubmitting}
          legend={'Základní informace'}
        >
          <TextField
            label={'Rok'}
            {...getInputProps(fields.year, { type: 'number' })}
            errors={fields.year.errors}
            step={1}
          />
          <TextField
            label={'Pořadí v roce'}
            {...getInputProps(fields.order, { type: 'number' })}
            errors={fields.order.errors}
            step={1}
          />
          <TextField
            hint={'Bez roku. Z názvu podzim vznikne podzim 2026.'}
            label={'Název'}
            placeholder={'Nepovinné'}
            {...getInputProps(fields.name, { type: 'text' })}
            errors={fields.name.errors}
          />
          <TextField
            hint={
              'Pro samostatně vytištěný doplněk, třeba Maturitní ples. Zadejte rok a pořadí čísla, ke kterému patří.'
            }
            label={'Doplněk'}
            placeholder={'Nepovinné'}
            {...getInputProps(fields.supplement, { type: 'text' })}
            errors={fields.supplement.errors}
          />
        </Fieldset>

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Soubory'}>
          <input {...getInputProps(fields.coverId, { type: 'hidden' })} />
          <FileInput
            errors={fields.cover.errors}
            label={'Obálka'}
            onChange={handleFileChange(fields.cover.name, fields.cover.dirty)}
            {...getInputProps(fields.cover, { type: 'file' })}
            accept={'image'}
          />
          <input {...getInputProps(fields.pdfId, { type: 'hidden' })} />
          <FileInput
            errors={fields.pdf.errors}
            label={'PDF'}
            onChange={handleFileChange(fields.pdf.name, fields.pdf.dirty)}
            {...getInputProps(fields.pdf, { type: 'file' })}
            accept={'pdf'}
          />
        </Fieldset>

        <Fieldset
          disabled={isLoadingOrSubmitting}
          legend={'Informace o autorovi'}
        >
          <Select
            errors={fields.authorId.errors}
            label={'Autor'}
            {...getSelectProps(fields.authorId)}
          >
            {loaderData.authors.map((author) => {
              return (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              )
            })}
          </Select>
        </Fieldset>

        <AuthenticityTokenInput />

        <FormActions>
          <Button disabled={!canSubmit} type={'submit'}>
            {isSubmitting ? 'Upravuje se...' : 'Upravit'}
          </Button>
          <LinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/archive/:issueId', { issueId })}
            variant={'outline'}
          >
            Zrušit
          </LinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'
