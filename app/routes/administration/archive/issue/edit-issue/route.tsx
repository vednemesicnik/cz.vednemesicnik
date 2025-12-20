// noinspection JSUnusedGlobalSymbols

import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
} from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { href, useNavigation } from 'react-router'

import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Button } from '~/components/button'
import { Fieldset } from '~/components/fieldset'
import { FileInput } from '~/components/file-input'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import { Input } from '~/components/input'
import { Select } from '~/components/select'
import { getFormattedDateString } from '~/utils/get-formatted-date-string'
import { getIssueOrdinalNumber } from '~/utils/get-issue-ordinal-number'
import { schema } from './_schema'

export default function Route({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { issue } = loaderData
  const { state } = useNavigation()

  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
    defaultValue: {
      authorId: issue.author.id,
      coverId: issue.cover?.id,
      id: issue.id,
      ordinalNumber: getIssueOrdinalNumber(issue.label),
      pdfId: issue.pdf?.id,
      releasedAt: getFormattedDateString(issue.releasedAt),
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
  const canSubmit = !isLoadingOrSubmitting && form.valid

  return (
    <AdminPage>
      <AdminHeadline>Upravit číslo ({issue.label})</AdminHeadline>
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
          <Input
            label={'Pořadové číslo'}
            {...getInputProps(fields.ordinalNumber, { type: 'number' })}
            errors={fields.ordinalNumber.errors}
            step={1}
          />
          <Input
            label={'Datum vydání'}
            {...getInputProps(fields.releasedAt, { type: 'date' })}
            errors={fields.releasedAt.errors}
          />
        </Fieldset>

        <Fieldset disabled={isLoadingOrSubmitting} legend={'Soubory'}>
          <input {...getInputProps(fields.coverId, { type: 'hidden' })} />
          <FileInput
            accept={'image'}
            errors={fields.cover.errors}
            label={'Obálka'}
            onChange={handleFileChange(fields.cover.name, fields.cover.dirty)}
            {...getInputProps(fields.cover, { type: 'file' })}
          />
          <input {...getInputProps(fields.pdfId, { type: 'hidden' })} />
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
          <Button disabled={!canSubmit} type="submit" variant={'primary'}>
            Upravit
          </Button>
          <AdminLinkButton
            to={href('/administration/archive/:issueId', { issueId: issue.id })}
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
