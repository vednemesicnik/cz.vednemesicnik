// noinspection JSUnusedGlobalSymbols
import { Form, href, useNavigation } from 'react-router'

import { AdminSignInCard } from '~/components/admin/admin-sign-in-card'
import { Button } from '~/components/button'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { Link } from '~/components/link'
import { FORM_CONFIG } from '~/config/form-config'

import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'

// The emergency sign-in link an Administrator issued during a Google outage
// (#578, design 20f). Copy approved (n2fjcvyq).
export default function RouteComponent({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'

  // An invalid link has no button: a new one comes only from an
  // Administrator, so the card says whom to ask. A failed „Přihlásit se“ shows
  // the same card (20f).
  if (
    actionData?.status === 'invalid' ||
    loaderData.status === 'invalid' ||
    loaderData.status === 'invalid-signed-in'
  ) {
    const isSignedIn = loaderData.status === 'invalid-signed-in'

    return (
      <AdminSignInCard title={'Odkaz už neplatí'}>
        <p className={styles.text}>
          {isSignedIn
            ? 'Vraťte se do administrace — tento nouzový odkaz už neplatí.'
            : 'Přihlaste se jinak nebo se obraťte na Administrátora či Vlastníka — tento nouzový odkaz už neplatí.'}
        </p>
        <Link
          className={styles.link}
          to={
            isSignedIn
              ? href('/administration')
              : href('/administration/sign-in')
          }
        >
          {isSignedIn ? 'Zpět do administrace' : 'Přihlásit se jinak'}
        </Link>
      </AdminSignInCard>
    )
  }

  // The same account has nothing to confirm; the link lapses by itself.
  if (loaderData.status === 'same-account') {
    return (
      <AdminSignInCard title={'Už jste přihlášení'}>
        <p className={styles.text}>
          Pokračujte do Nastavení — v tomto prohlížeči už jste přihlášení.
        </p>
        <p className={styles.account}>
          Účet: <span className={styles.value}>{loaderData.email}</span>
        </p>
        {/* A navigation drawn as the primary button (20f). */}
        <Form action={href('/administration/settings')} method={'get'}>
          <Button className={styles.button} type={'submit'}>
            Pokračovat do Nastavení
          </Button>
        </Form>
      </AdminSignInCard>
    )
  }

  // Often a shared computer in the newsroom: signing out deletes nothing and
  // leads back here, to the confirmation (20f).
  if (loaderData.status === 'other-account') {
    return (
      <AdminSignInCard title={'Odkaz je pro jiný účet'}>
        <p className={styles.text}>
          Odhlaste se a pokračujte — v tomto prohlížeči je přihlášený jiný účet.
        </p>
        <p className={styles.account}>
          Účet pro tento odkaz:{' '}
          <span className={styles.value}>{loaderData.email}</span>
        </p>
        <Form method={'post'}>
          <HoneypotInputs />
          <input name={'token'} type={'hidden'} value={loaderData.token} />
          <input
            name={FORM_CONFIG.intent.name}
            type={'hidden'}
            value={FORM_CONFIG.intent.value.signOut}
          />
          <Button
            className={styles.button}
            disabled={isSubmitting}
            type={'submit'}
          >
            Odhlásit se a pokračovat
          </Button>
        </Form>
        <Link className={styles.link} to={href('/administration')}>
          Zpět do administrace
        </Link>
      </AdminSignInCard>
    )
  }

  return (
    <AdminSignInCard title={'Potvrďte přihlášení'}>
      {/* The account says where, the pair under it by what and from whom. */}
      <div className={styles.details}>
        <p className={styles.line}>
          Účet: <span className={styles.value}>{loaderData.email}</span>
        </p>
        <p className={styles.origin}>
          <span>Nouzový odkaz</span>
          {loaderData.issuerName !== null && (
            <span>
              Odkaz od:{' '}
              <span className={styles.value}>{loaderData.issuerName}</span>
            </span>
          )}
        </p>
      </div>
      <Form method={'post'}>
        <HoneypotInputs />
        <input name={'token'} type={'hidden'} value={loaderData.token} />
        <Button
          className={styles.button}
          disabled={isSubmitting}
          type={'submit'}
        >
          {isSubmitting ? 'Přihlašuji…' : 'Přihlásit se'}
        </Button>
      </Form>
      <p className={styles.note}>
        Po přihlášení si můžete v Nastavení přidat passkey.
      </p>
      <p className={styles.hint}>
        Nežádali jste o tento odkaz? Stránku zavřete.
      </p>
    </AdminSignInCard>
  )
}
