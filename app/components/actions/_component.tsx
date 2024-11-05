import { Link } from "@remix-run/react"

import { Button } from "~/components/button"

import styles from "./_styles.module.css"

type Props = {
  editPath: string
  onDelete: () => void
}

export const Actions = ({ editPath, onDelete }: Props) => {
  return (
    <section className={styles.container}>
      <Link to={editPath}>Upravit</Link>
      <Button onClick={onDelete} variant={"danger"}>
        Odstranit
      </Button>
    </section>
  )
}
