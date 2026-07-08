// noinspection JSUnusedGlobalSymbols
import { Form, Link, useNavigation } from 'react-router'

import { AdminButton } from '~/components/admin/admin-button'
import { HoneypotInputs } from '~/components/honeypot-inputs'

import styles from './_styles.module.css'
import type { Route } from './+types/route'

export { action } from './_action'
export { headers } from './_headers'
export { loader } from './_loader'
export { meta } from './_meta'

export default function RouteComponent({ loaderData }: Route.ComponentProps) {
  const navigation = useNavigation()
  const isSubmitting = navigation.state !== 'idle'

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
              to={'/administration/sign-in/magic-link'}
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

          <AdminButton
            className={styles.button}
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? 'Přihlašuji…' : 'Přihlásit se'}
          </AdminButton>
        </Form>
      </section>
    </div>
  )
}
