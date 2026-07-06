// noinspection JSUnusedGlobalSymbols
import { Form, Link } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { HoneypotInputs } from '~/components/honeypot-inputs'

import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
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
              to={'/administration/auth/magic-link'}
            >
              Požádat o nový odkaz
            </Link>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <section className={styles.card}>
        <h1 className={styles.title}>Přihlášení odkazem</h1>

        <p className={styles.subtitle}>
          Pro dokončení přihlášení do administrace klikněte na tlačítko níže.
        </p>

        <Form className={styles.form} method={'post'}>
          <HoneypotInputs />

          <input name={'token'} type={'hidden'} value={loaderData.token} />
          <input name={'email'} type={'hidden'} value={loaderData.email} />

          <AdminButton className={styles.button} type="submit">
            Přihlásit se
          </AdminButton>
        </Form>
      </section>
    </div>
  )
}
