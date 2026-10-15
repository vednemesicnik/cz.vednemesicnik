// noinspection JSUnusedGlobalSymbols
import { Form, href, useNavigation } from 'react-router'

import { AdminSignInCard } from '~/components/admin/admin-sign-in-card'
import { AdminSignInText } from '~/components/admin/admin-sign-in-text'
import { Button } from '~/components/button'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Link } from '~/components/link'
import { withRedirectTo } from '~/utils/with-redirect-to'

import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { getMagicLinkVerifyHeading } from './utils/get-magic-link-verify-heading'

export { action } from './_action'
export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'

// An opened magic link (design 20c). Copy approved (gs905c2e, njslpjov).
export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'
  const heading = getMagicLinkVerifyHeading(loaderData.status)

  // A navigation drawn as the primary button (20c).
  const backToSettings = (
    <Form
      action={href('/administration/settings')}
      method={'get'}
      viewTransition
    >
      <Button type={'submit'}>Zpět do Nastavení</Button>
    </Form>
  )

  // A browser already signed in to another account (design 20c, so197jap).
  if (loaderData.status === 'other-account') {
    return (
      <AdminSignInCard title={heading}>
        <AdminSignInText>
          Odkaz otevřete v prohlížeči, kde se ověřujete — patří účtu{' '}
          <span className={styles.value}>{loaderData.email}</span> a tady je
          přihlášený jiný účet.
        </AdminSignInText>
        {backToSettings}
      </AdminSignInCard>
    )
  }

  // A signed-in browser gets a new link from the identity check in Nastavení.
  if (loaderData.status === 'invalid-signed-in') {
    return (
      <AdminSignInCard title={heading}>
        <AdminSignInText>
          Nový odkaz si pošlete v Nastavení — tento vypršel, byl použitý nebo ho
          nahradil nový.
        </AdminSignInText>
        {backToSettings}
      </AdminSignInCard>
    )
  }

  // Expired, used or replaced: one click sends a new link to the address in
  // this one, and lands on the sent state (20b).
  if (loaderData.status === 'invalid') {
    return (
      <AdminSignInCard title={heading}>
        <AdminSignInText>
          Odkaz vypršel, byl použitý nebo ho nahradil nový. Můžete si poslat
          nový na <span className={styles.value}>{loaderData.email}</span>.
        </AdminSignInText>

        <Form
          action={withRedirectTo(
            href('/administration/sign-in/magic-link'),
            loaderData.redirectTo,
          )}
          method={'post'}
        >
          <HoneypotInputs />
          <input name={'email'} type={'hidden'} value={loaderData.email} />
          <input
            name={'redirectTo'}
            type={'hidden'}
            value={loaderData.redirectTo}
          />
          <Button disabled={isSubmitting} type={'submit'}>
            Poslat nový odkaz
          </Button>
        </Form>

        <Link
          to={withRedirectTo(
            href('/administration/sign-in'),
            loaderData.redirectTo,
          )}
        >
          Přihlásit se jinak
        </Link>
      </AdminSignInCard>
    )
  }

  // The signed-in account's own link confirms the identity check, it doesn't
  // sign in (design 20c, so197jap).
  const isIdentityCheck = loaderData.status === 'verify-identity'

  return (
    <AdminSignInCard title={heading}>
      <AdminSignInText>
        Účet: <span className={styles.value}>{loaderData.email}</span>
      </AdminSignInText>

      <Form method={'post'}>
        <HoneypotInputs />

        <input name={'token'} type={'hidden'} value={loaderData.token} />
        <input name={'email'} type={'hidden'} value={loaderData.email} />
        <input
          name={'redirectTo'}
          type={'hidden'}
          value={loaderData.redirectTo}
        />

        <Button disabled={isSubmitting} type="submit">
          {isIdentityCheck
            ? 'Potvrdit ověření'
            : isSubmitting
              ? 'Přihlašuji…'
              : 'Přihlásit se'}
        </Button>
      </Form>

      {/* The identity check was asked for in Nastavení, by the signed-in
          person (20c). */}
      {isIdentityCheck ? null : (
        <AdminSignInText variant={'quiet'}>
          Nežádali jste o přihlášení? Stránku zavřete.
        </AdminSignInText>
      )}
    </AdminSignInCard>
  )
}
