// noinspection JSUnusedGlobalSymbols
import { Form, href, Link, useNavigation } from 'react-router'

import { AdminLinkButton } from '~/components/admin/admin-link-button'
import { Button } from '~/components/button'
import { HoneypotInputs } from '~/components/honeypot-inputs'
import { withRedirectTo } from '~/utils/with-redirect-to'

import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'

  // A browser already signed in to another account (design 20c, so197jap).
  if (loaderData.status === 'other-account') {
    return (
      <div className={styles.container}>
        <section className={styles.card}>
          <h1 className={styles.title}>Odkaz je pro jiný účet</h1>

          <p className={styles.message}>
            Odkaz otevřete v prohlížeči, kde se ověřujete — patří účtu{' '}
            {loaderData.email} a tady je přihlášený jiný účet.
          </p>

          <div className={styles.footer}>
            <AdminLinkButton to={href('/administration/settings')}>
              Zpět do Nastavení
            </AdminLinkButton>
          </div>
        </section>
      </div>
    )
  }

  // A signed-in browser gets a new link from the identity check in Nastavení.
  if (loaderData.status === 'invalid-signed-in') {
    return (
      <div className={styles.container}>
        <section className={styles.card}>
          <h1 className={styles.title}>Odkaz už neplatí</h1>

          <p className={styles.message}>
            Nový odkaz si pošlete v Nastavení — tento vypršel, byl použitý nebo
            ho nahradil nový.
          </p>

          <div className={styles.footer}>
            <AdminLinkButton to={href('/administration/settings')}>
              Zpět do Nastavení
            </AdminLinkButton>
          </div>
        </section>
      </div>
    )
  }

  if (loaderData.status === 'invalid') {
    return (
      <div className={styles.container}>
        <section className={styles.card}>
          <h1 className={styles.title}>Odkaz je neplatný</h1>

          <p className={styles.message}>
            Přihlašovací odkaz je neplatný nebo jeho platnost vypršela.
            Požádejte prosím o nový.
          </p>

          <div className={styles.footer}>
            <Link
              className={styles.link}
              to={withRedirectTo(
                '/administration/sign-in/magic-link',
                loaderData.redirectTo,
              )}
            >
              Požádat o nový odkaz
            </Link>
          </div>
        </section>
      </div>
    )
  }

  // The signed-in account's own link confirms the identity check, it doesn't
  // sign in (design 20c, so197jap).
  const isIdentityCheck = loaderData.status === 'verify-identity'

  return (
    <div className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>
          {isIdentityCheck ? 'Ověřte, že jste to vy' : 'Přihlášení odkazem'}
        </h1>

        <p className={styles.subtitle}>
          {isIdentityCheck
            ? `Účet: ${loaderData.email}`
            : 'Pro dokončení přihlášení do administrace klikněte na tlačítko níže.'}
        </p>

        <Form className={styles.form} method={'post'}>
          <HoneypotInputs />

          <input name={'token'} type={'hidden'} value={loaderData.token} />
          <input name={'email'} type={'hidden'} value={loaderData.email} />
          <input
            name={'redirectTo'}
            type={'hidden'}
            value={loaderData.redirectTo}
          />

          <Button
            className={styles.button}
            disabled={isSubmitting}
            type="submit"
          >
            {isIdentityCheck
              ? 'Potvrdit ověření'
              : isSubmitting
                ? 'Přihlašuji…'
                : 'Přihlásit se'}
          </Button>
        </Form>
      </section>
    </div>
  )
}
