// noinspection JSUnusedGlobalSymbols

import { Form, href } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { AdminDetailItem } from '~/components/admin/admin-detail-item'
import { AdminDetailList } from '~/components/admin/admin-detail-list'
import { AdminDetailSection } from '~/components/admin/admin-detail-section'
import { AdminHeadline } from '~/components/admin/admin-headline'
import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { AdminPage } from '~/components/admin/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import type { Route } from './+types/route'
import { RegisterPasskey } from './components/register-passkey'

export { action } from './_action'
export { handle } from './_handle'
export { loader } from './_loader'
export { meta } from './_meta'

// credentialDeviceType → Czech label.
const deviceTypeLabels: Record<string, string> = {
  multiDevice: 'Synchronizovaný (napříč zařízeními)',
  singleDevice: 'Vázaný na zařízení',
}

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <AdminPage>
      <AdminHeadline>Passkeys</AdminHeadline>

      <p>
        Passkey umožňuje přihlášení pomocí biometrie (otisk prstu, obličej) nebo
        PIN zařízení, bez zadávání hesla.
      </p>

      <RegisterPasskey />

      <AdminDetailSection title="Vaše passkeys">
        {loaderData.passkeys.length === 0 ? (
          <p>Zatím nemáte žádné passkeys.</p>
        ) : (
          loaderData.passkeys.map((passkey) => (
            <div key={passkey.id}>
              <AdminDetailList>
                <AdminDetailItem label="Typ">
                  {deviceTypeLabels[passkey.deviceType] ?? passkey.deviceType}
                </AdminDetailItem>
                <AdminDetailItem label="Přidáno">
                  {passkey.createdAt}
                </AdminDetailItem>
              </AdminDetailList>

              <Form method="post">
                <AuthenticityTokenInput />
                <input name="passkeyId" type="hidden" value={passkey.id} />
                <AdminButton type="submit" variant="danger">
                  Odstranit
                </AdminButton>
              </Form>
            </div>
          ))
        )}
      </AdminDetailSection>

      <AdminLinkButton to={href('/administration/settings/profile')}>
        Zpět
      </AdminLinkButton>
    </AdminPage>
  )
}
