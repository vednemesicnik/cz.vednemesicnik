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
import { AdminInput } from '~/components/admin-input'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Fieldset } from '~/components/fieldset'
import { FileInput } from '~/components/file-input'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Select } from '~/components/select'
import { getFormattedDateString } from '~/utils/get-formatted-date-string'
import { schema } from './_schema'
import type { Route } from './+types/route'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: loaderData.selfAuthorId,
      ordinalNumber: '',
      releasedAt: getFormattedDateString(new Date()),
    },
    id: 'add-archived-issue',
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
      <AdminHeadline>Přidat číslo</AdminHeadline>

      <Form
        encType={'multipart/form-data'}
        method={'post'}
        {...getFormProps(form)}
        errors={form.errors}
      >
        <Fieldset
          disabled={isLoadingOrSubmitting}
          legend={'Základní informace'}
        >
          <AdminInput
            label={'Pořadové číslo'}
            {...getInputProps(fields.ordinalNumber, { type: 'number' })}
            errors={fields.ordinalNumber.errors}
            placeholder={'1'}
            step={1}
          />
          <AdminInput
            label={'Datum vydání'}
            {...getInputProps(fields.releasedAt, { type: 'date' })}
            errors={fields.releasedAt.errors}
          />
        </Fieldset>

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Soubory'}>
          <FileInput
            accept={'image'}
            errors={fields.cover.errors}
            label={'Obálka'}
            onChange={handleFileChange(fields.cover.name, fields.cover.dirty)}
            {...getInputProps(fields.cover, { type: 'file' })}
          />
          <FileInput
            accept={'pdf'}
            errors={fields.pdf.errors}
            label={'PDF'}
            onChange={handleFileChange(fields.pdf.name, fields.pdf.dirty)}
            {...getInputProps(fields.pdf, { type: 'file' })}
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
            {isSubmitting ? 'Přidává se...' : 'Přidat'}
          </AdminButton>
          <AdminLinkButton
            disabled={isLoadingOrSubmitting}
            to={href('/administration/archive')}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
