// noinspection JSUnusedGlobalSymbols
import { Form, href } from 'react-router'

import { AdminSignInCard } from '~/components/admin/admin-sign-in-card'
import { Button } from '~/components/button'
import { Callout } from '~/components/callout'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Link } from '~/components/link'
import { withRedirectTo } from '~/utils/with-redirect-to'

import type { Route } from './+types/route'
import { PasskeyForm } from './components/passkey-form'

export { loader } from './_loader'
export { meta } from './_meta'

// The sign-in chooser (design 20a, 20e). Copy approved (gs905c2e, uquz5xhn).
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const magicLinkPath = href('/administration/sign-in/magic-link')
  const hasRedirectTo =
    withRedirectTo(magicLinkPath, loaderData.redirectTo) !== magicLinkPath

  return (
    <AdminSignInCard title={'Přihlášení do administrace'} wordmark>
      {loaderData.error !== null ? (
        <Callout role={'alert'} tone={'error'}>
          {loaderData.error}
        </Callout>
      ) : null}

      {/* Native POST: the action redirects to google.com, so we want a full
          top-level navigation (not a client-side fetch). */}
      <form action={href('/administration/sign-in/google')} method={'post'}>
        <HoneypotInputs />
        <input
          name={'redirectTo'}
          type={'hidden'}
          value={loaderData.redirectTo}
        />
        <Button type={'submit'}>Přihlásit se přes Google</Button>
      </form>

      <PasskeyForm redirectTo={loaderData.redirectTo} />

      {/* Until the e-mail field moves onto this card (20a), a navigation drawn
          as an outline button. */}
      <Form action={magicLinkPath} method={'get'} viewTransition>
        {hasRedirectTo ? (
          <input
            name={'redirectTo'}
            type={'hidden'}
            value={loaderData.redirectTo}
          />
        ) : null}
        <Button type={'submit'} variant={'outline'}>
          Přihlásit odkazem v e-mailu
        </Button>
      </Form>

      {loaderData.allowPasswordSignIn ? (
        <Link
          to={withRedirectTo(
            href('/administration/sign-in/password'),
            loaderData.redirectTo,
          )}
        >
          Nouzové přihlášení heslem
        </Link>
      ) : null}
    </AdminSignInCard>
  )
}
