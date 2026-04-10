import { Form, Link } from 'react-router'

import styles from './_navigation.module.css'

export const Navigation = () => {
  return (
    <nav className={styles.container}>
      <Link className={styles.link_button} to={'/administration'}>
        Administrace
      </Link>
      <Form
        action={'/administration/sign-out'}
        className={styles.form}
        method={'post'}
      >
        <button className={styles.button} type="submit">
          Odhlásit se
        </button>
      </Form>
    </nav>
  )
}
