import { Form, Link } from "react-router";

import styles from "./_navigation.module.css"

export const Navigation = () => {
  return (
    <nav className={styles.container}>
      <Link className={styles.link_button} to={"/administration"}>
        Administrace
      </Link>
      <Form
        className={styles.form}
        method={"post"}
        action={"/administration/sign-out"}
      >
        <button className={styles.button} type="submit">
          Odhlásit se
        </button>
      </Form>
    </nav>
  )
}
