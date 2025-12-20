import { BaseLink } from '~/components/base-link'
import { Button } from '~/components/button'
import { DeleteIcon } from '~/components/icons/delete-icon'
import { EditIcon } from '~/components/icons/edit-icon'
import { VisibilityIcon } from '~/components/icons/visibility-icon'

import styles from './_styles.module.css'

type Props = {
  viewPath?: string
  editPath?: string
  onDelete?: () => void
}

export const Actions = ({ viewPath, editPath, onDelete }: Props) => {
  return (
    <section className={styles.container}>
      {viewPath && (
        <BaseLink aria-label="View" to={viewPath}>
          <VisibilityIcon />
        </BaseLink>
      )}
      {editPath && (
        <BaseLink aria-label="Edit" to={editPath}>
          <EditIcon />
        </BaseLink>
      )}
      {onDelete && (
        <Button aria-label="Delete" onClick={onDelete} variant={'danger'}>
          <DeleteIcon />
        </Button>
      )}
    </section>
  )
}
