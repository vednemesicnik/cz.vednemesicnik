// noinspection JSUnusedGlobalSymbols

import { Form } from 'react-router'

import { AdminAvatar } from '~/components/admin-avatar'
import { AdminButton } from '~/components/admin-button'
import { AdminDetailItem } from '~/components/admin-detail-item'
import { AdminDetailList } from '~/components/admin-detail-list'
import { AdminDetailSection } from '~/components/admin-detail-section'
import { AdminHeadline } from '~/components/admin-headline'
import { AdminLinkButton } from '~/components/admin-link-button'
import { AdminPage } from '~/components/admin-page'
import { AuthenticityTokenInput } from '~/components/authenticity-token-input'
import { FORM_CONFIG } from '~/config/form-config'
import { getUserImageSrc } from '~/utils/get-user-image-src'

import type { Route } from './+types/route'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const imageSrc = getUserImageSrc(loaderData.user.image?.id ?? '')
  const imageAlt = loaderData.user.image?.altText ?? ''

  return (
    <AdminPage>
      <AdminHeadline>Profil</AdminHeadline>

      <AdminDetailSection title="Základní informace">
        <AdminAvatar alt={imageAlt} size="large" src={imageSrc} />

        <AdminDetailList>
          <AdminDetailItem label="E-mail">
            {loaderData.user.email}
          </AdminDetailItem>
          <AdminDetailItem label="Uživatelské jméno">
            {loaderData.user.username}
          </AdminDetailItem>
          <AdminDetailItem label="Jméno">
            {loaderData.user.name}
          </AdminDetailItem>
        </AdminDetailList>

        <AdminLinkButton to="/administration/settings/profile/change-password">
          Změnit heslo
        </AdminLinkButton>
      </AdminDetailSection>

      {loaderData.user.sessions.length > 0 && (
        <AdminDetailSection title="Aktivní relace">
          <AdminDetailList>
            <AdminDetailItem label="Počet přihlášení na jiných zařízeních">
              {loaderData.user.sessions.length}
            </AdminDetailItem>
          </AdminDetailList>

          <Form method="post">
            <input name="userId" type="hidden" value={loaderData.user.id} />
            <input
              name="currentSessionId"
              type="hidden"
              value={loaderData.currentSession.id}
            />
            <AuthenticityTokenInput />
            <AdminButton
              name={FORM_CONFIG.intent.name}
              type="submit"
              value={FORM_CONFIG.intent.value.delete}
              variant="danger"
            >
              Ukončit všechna ostatní přihlášení
            </AdminButton>
          </Form>
        </AdminDetailSection>
      )}
    </AdminPage>
  )
}

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'
