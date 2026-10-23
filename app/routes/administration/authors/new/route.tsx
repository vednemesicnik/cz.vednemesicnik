// noinspection JSUnusedGlobalSymbols

import { getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod/v4'
import { useEffect, useRef } from 'react'
import { href, useFetcher, useNavigation } from 'react-router'
import { AdminPage } from '~/components/admin/admin-page'
import { Button } from '~/components/button'
import { PageTitle } from '~/components/page-title'
import { Radio } from '~/components/radio'
import { RadioGroup } from '~/components/radio-group'
import { RecordForm } from '~/components/record-form'
import { RecordFormActions } from '~/components/record-form-actions'
import { TextField } from '~/components/text-field'
import { useToast } from '~/components/toast-provider'
import { getAuthorRoleDescription } from '~/utils/get-author-role-description'
import { getAuthorRoleLabel } from '~/utils/role-labels'
import { useReturnToOpener } from '~/utils/use-return-to-opener'
import { AUTHOR_RECORD_COPY } from '../author-record-copy'
import { AuthorBioField } from '../components/author-bio-field'
import { authorRecordSchema } from '../utils/author-record-schema'
import type { action } from './_action'
import type { Route } from './+types/route'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

/**
 * Nový autor (design 28c): the name as it stands at the content, the author
 * role as a choice of three with what each allows, and an optional bio. From
 * an article's author search, Vytvořit goes back to its editor with the new
 * author chosen (24j); otherwise a toast and back to the opener.
 */
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { articleId, replacedAuthorId, roles } = loaderData
  const navigation = useNavigation()
  const showToast = useToast()
  const fetcher = useFetcher<typeof action>()
  const parentPath =
    articleId === null
      ? href('/administration/authors')
      : href('/administration/articles/:articleId/edit-article', { articleId })
  const { handleCancel, leave } = useReturnToOpener(parentPath)

  const lastResult =
    fetcher.data !== undefined && 'submissionResult' in fetcher.data
      ? fetcher.data.submissionResult
      : undefined

  const [form, fields] = useForm({
    constraint: getZodConstraint(authorRecordSchema),
    // The name typed in an article's author search (24j).
    defaultValue: { name: loaderData.name, roleId: loaderData.defaultRoleId },
    id: 'new-author',
    lastResult,
    onValidate: ({ formData }) =>
      parseWithZod(formData, { schema: authorRecordSchema }),
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

    showToast(AUTHOR_RECORD_COPY.toasts.created)
    leave()
  })

  // Created and leaving: the page stays until the next one loads, and a
  // second click must not send the form again.
  const isSubmitting =
    fetcher.state !== 'idle' ||
    navigation.state !== 'idle' ||
    (fetcher.data !== undefined && 'status' in fetcher.data)

  return (
    <AdminPage measure={'form'}>
      <PageTitle>{AUTHOR_RECORD_COPY.newTitle}</PageTitle>

      <RecordForm fetcher={fetcher} form={form}>
        <TextField
          label={'Jméno'}
          {...getInputProps(fields.name, { type: 'text' })}
          errors={fields.name.errors}
          hint={AUTHOR_RECORD_COPY.nameHint}
        />

        <RadioGroup legend={AUTHOR_RECORD_COPY.roleLegend}>
          {roles.map((role) => (
            <Radio
              {...getInputProps(fields.roleId, {
                type: 'radio',
                value: role.id,
              })}
              hint={getAuthorRoleDescription(role.name)}
              id={`${fields.roleId.id}-${role.name}`}
              key={role.id}
            >
              {getAuthorRoleLabel(role.name)}
            </Radio>
          ))}
        </RadioGroup>

        <AuthorBioField field={fields.bio} />

        {/* Back to that article's editor after creating (24j), replacing the
            author the search started from (ivyin4kr). */}
        {articleId !== null && (
          <input name={'article'} type={'hidden'} value={articleId} />
        )}
        {articleId !== null && replacedAuthorId !== null && (
          <input name={'replace'} type={'hidden'} value={replacedAuthorId} />
        )}

        <RecordFormActions
          cancelPath={parentPath}
          disabled={isSubmitting}
          onCancel={handleCancel}
        >
          <Button disabled={isSubmitting} type={'submit'}>
            Vytvořit
          </Button>
        </RecordFormActions>
      </RecordForm>
    </AdminPage>
  )
}
