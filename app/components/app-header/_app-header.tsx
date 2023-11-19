import styles from "./_app-header.module.css"
import { VdmLogo } from "~/components/vdm-logo"
import { Link } from "@remix-run/react"

export const AppHeader = () => {
  return (
    <header className={styles.container}>
      <section className={styles.content}>
        <Link to={"/"} className={styles.link}>
          <VdmLogo className={styles.logo} />
          <h1 className={styles.name}>Vedneměsíčník</h1>
        </Link>
      </section>
    </header>
  )
}

AppHeader.displayName = "AppHeader"
