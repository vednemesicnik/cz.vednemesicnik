// noinspection JSUnusedGlobalSymbols
import { Form, href, useNavigation } from 'react-router'

import { AdminButtonLink } from '~/components/admin/admin-button-link'
import { AdminSignInCard } from '~/components/admin/admin-sign-in-card'
import { AdminSignInText } from '~/components/admin/admin-sign-in-text'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Link } from '~/components/link'
import { withRedirectTo } from '~/utils/with-redirect-to'

import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'
export { middleware } from './_middleware'

// The sent state (design 20b); the field itself is on the chooser (20a).
// Copy approved (gs905c2e).
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'

  return (
    <AdminSignInCard title={'Zkontrolujte e-mail'}>
      <AdminSignInText>
        Pokud k adrese <span className={styles.value}>{loaderData.email}</span>{' '}
        patří účet, odkaz byl odeslán. Platí 15 minut.
      </AdminSignInText>
      <AdminSignInText variant={'quiet'}>
        Odkaz můžete otevřít i na jiném zařízení. Přihlásíte se na něm po
        potvrzení.
      </AdminSignInText>

      <div className={styles.actions}>
        {/* A new link replaces the old one (createMagicLinkToken, upsert). */}
        <Form method={'post'}>
          <HoneypotInputs />
          <input name={'email'} type={'hidden'} value={loaderData.email} />
          <input
            name={'redirectTo'}
            type={'hidden'}
            value={loaderData.redirectTo}
          />
          <AdminButtonLink
            className={styles.resend}
            disabled={isSubmitting}
            type={'submit'}
          >
            Poslat znovu
          </AdminButtonLink>
        </Form>

        {/* Back to 20a with the field filled; router state keeps the address
            out of the URL. */}
        <Link
          state={{ email: loaderData.email }}
          to={withRedirectTo(
            href('/administration/sign-in'),
            loaderData.redirectTo,
          )}
        >
          Zadat jiný e-mail
        </Link>
      </div>

      <AdminSignInText className={styles.replaces} variant={'quiet'}>
        Nový odkaz nahradí předchozí.
      </AdminSignInText>
    </AdminSignInCard>
  )
}
