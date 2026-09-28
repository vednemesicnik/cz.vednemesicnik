// noinspection JSUnusedGlobalSymbols

import { href, useNavigation } from 'react-router'
import { AdminButton } from '~/components/admin/admin-button'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import { AdminParagraph } from '~/components/admin/admin-paragraph'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { Form } from '~/components/form'
import { FormActions } from '~/components/form-actions'
import type { Route } from './+types/route'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const { state } = useNavigation()
  const isSubmitting = state !== 'idle'

  return (
    <AdminPage>
      <AdminHeadline>Ověřte, že jste to vy</AdminHeadline>
      <AdminParagraph>
        Než změníte přihlášení, přihlaste se znovu jednou z cest, kterými se
        přihlašujete.
      </AdminParagraph>

      <Form method="post">
        <input name="redirectTo" type="hidden" value={loaderData.redirectTo} />
        <AuthenticityTokenInput />

        <FormActions>
          <AdminButton disabled={isSubmitting} type={'submit'}>
            Přihlásit se znovu
          </AdminButton>
          <AdminLinkButton
            disabled={isSubmitting}
            to={href('/administration/settings/profile')}
          >
            Zrušit
          </AdminLinkButton>
        </FormActions>
      </Form>
    </AdminPage>
  )
}
