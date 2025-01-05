import { useFetcher } from "react-router"

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
      <h2 id={titleId}>Opravdu chcete tutu akci provést?</h2>
      <section className={styles.actions}>
        <Button onClick={onClose} variant={"default"}>
          Ne
        </Button>
        <Form
          method="post"
          preventScrollReset={true}
          onSubmit={onClose}
          className={styles.form}
        >
          <AuthenticityTokenInput />
          <input type="hidden" name={"id"} defaultValue={id} />
          <Button
            type="submit"
            variant={"danger"}
            name={formConfig.intent.name}
            value={formConfig.intent.value.delete}
          >
            Ano
          </Button>
        </Form>
      </section>
    </Modal>
  )
}
