// noinspection JSUnusedGlobalSymbols
import { Link } from 'react-router'

import styles from './_styles.module.css'
import type { Route } from './+types/route'

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
