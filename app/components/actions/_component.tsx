import { BaseLink } from "~/components/base-link"
import { Button } from "~/components/button"
import { DeleteIcon } from "~/components/icons/delete-icon"
import { EditIcon } from "~/components/icons/edit-icon"
import { VisibilityIcon } from "~/components/icons/visibility-icon"

import styles from "./_styles.module.css"

type Props = {
  viewPath?: string
  editPath?: string
  onDelete?: () => void
}

export const Actions = ({ viewPath, editPath, onDelete }: Props) => {
  return (
    <section className={styles.container}>
      {viewPath && (
        <BaseLink to={viewPath} aria-label="View">
          <VisibilityIcon />
        </BaseLink>
      )}
      {editPath && (
        <BaseLink to={editPath} aria-label="Edit">
          <EditIcon />
        </BaseLink>
      )}
      {onDelete && (
        <Button onClick={onDelete} variant={"danger"} aria-label="Delete">
          <DeleteIcon />
        </Button>
      )}
    </section>
  )
}
