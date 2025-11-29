import { BaseLink } from "~/components/base-link"
import { Button } from "~/components/button"

import styles from "./_styles.module.css"

type Props = {
  canEdit?: boolean
  editPath: string
  canDelete?: boolean
  onDelete: () => void
}

export const Actions = ({
  editPath,
  onDelete,
  canEdit = true,
  canDelete = true,
}: Props) => {
  return (
    <section className={styles.container}>
      {canEdit && <BaseLink to={editPath}>Upravit</BaseLink>}
      {canDelete && (
        <Button onClick={onDelete} variant={"danger"}>
          Odstranit
        </Button>
      )}
    </section>
  )
}
