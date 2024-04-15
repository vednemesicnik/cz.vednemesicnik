import { Form, Link } from "@remix-run/react"
import styles from "./_navigation.module.css"

type Props = {
  children?: never
}

export const Navigation = (_: Props) => {
  return (
    <nav className={styles.container}>
      <Link className={styles.link_button} to={"/administration"}>
        Administrace
      </Link>
      <Form className={styles.form} method={"post"} action={"/signout"}>
        <button className={styles.button} type="submit">
          Odhlásit se
        </button>
      </Form>
    </nav>
  )
}
