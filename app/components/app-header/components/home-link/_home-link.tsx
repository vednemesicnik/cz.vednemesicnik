import styles from "./_home-link.module.css"
import { VdmLogo } from "~/components/vdm-logo"
import { Link } from "@remix-run/react"

type Props = {
  children?: never
  isInEditMode: boolean
}

export const HomeLink = ({ isInEditMode }: Props) => {
  return (
    <Link to={"/"} className={styles.link}>
      <VdmLogo className={styles.logo} variant={isInEditMode ? "editMode" : "default"} />
      <h1 className={styles.name}>Vedneměsíčník</h1>
    </Link>
  )
}
