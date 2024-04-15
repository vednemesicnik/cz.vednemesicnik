import { LinkButton } from "~/components/link-button"
import styles from "./_archive-admin-panel.module.css"

export const ArchiveAdminPanel = () => {
  return (
    <nav className={styles.container}>
      <LinkButton to={"/archive/add-issue"}>Přidat výtisk</LinkButton>
    </nav>
  )
}
