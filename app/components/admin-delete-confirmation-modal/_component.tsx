import { useFetcher } from "react-router"

import { AdminActionButton } from "~/components/admin-action-button"
import { AuthenticityTokenInput } from "~/components/authenticity-token-input"
import { Button } from "~/components/button"
import { Modal } from "~/components/modal"
import { formConfig } from "~/config/form-config"

import styles from "./_styles.module.css"

type Props = {
  id: string | undefined
  isOpen: boolean
  onClose: () => void
}

export const DeleteConfirmationModal = ({ id, isOpen, onClose }: Props) => {
  const { Form } = useFetcher()
  const titleId = `delete-confirmation-for-item-${id}`

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      titleId={titleId}
      className={styles.container}
    >
      <h2 id={titleId} className={styles.title}>
        Opravdu chcete tuto akci provést?
      </h2>
      <p className={styles.description}>Tato akce je nevratná.</p>
      <section className={styles.actions}>
        <Button onClick={onClose} variant={"default"}>
          Zrušit
        </Button>
        <Form
          method="post"
          preventScrollReset={true}
          onSubmit={onClose}
          className={styles.form}
        >
          <AuthenticityTokenInput />
          <input type="hidden" name={"id"} defaultValue={id} />
          <AdminActionButton
            type="submit"
            action={"delete"}
            name={formConfig.intent.name}
            value={formConfig.intent.value.delete}
          >
            Smazat
          </AdminActionButton>
        </Form>
      </section>
    </Modal>
  )
}
