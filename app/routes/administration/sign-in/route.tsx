// noinspection JSUnusedGlobalSymbols
import { Link } from 'react-router'

import { HoneypotInputs } from '~/components/honeypot-inputs'
import styles from './_styles.module.css'
import type { Route } from './+types/route'
import { PasskeyForm } from './components/passkey-form'

export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  return (
    <div className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>Přihlášení</h1>

        <p className={styles.subtitle}>
          Vyberte způsob přihlášení do administrace
        </p>

        {loaderData.error !== null ? (
          <p className={styles.error} role={'alert'}>
            {loaderData.error}
          </p>
        ) : null}

        {/* Native POST: the action redirects to google.com, so we want a full
            top-level navigation (not a client-side fetch). */}
        <form
          action={'/administration/sign-in/google'}
          className={styles.googleForm}
          method={'post'}
        >
          <HoneypotInputs />
          <input
            name={'redirectTo'}
            type={'hidden'}
            value={loaderData.redirectTo}
          />
          <button className={styles.googleButton} type={'submit'}>
            Přihlásit přes Google
          </button>
        </form>

        <PasskeyForm />

        <Link
          className={styles.linkButton}
          to={'/administration/sign-in/magic-link'}
        >
          Přihlásit odkazem v e-mailu
        </Link>

        {loaderData.allowPasswordSignIn ? (
          <div className={styles.footer}>
            <Link
              className={styles.link}
              to={'/administration/sign-in/password'}
            >
              Přihlásit heslem
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  )
}
