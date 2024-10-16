import { Form } from "@remix-run/react"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

import { Button } from "~/components/button"
import { LinkButton } from "~/components/link-button"
import { formConfig } from "~/config/form-config"

import styles from "./_archived-issue-admin-panel.module.css"

type Props = {
  issueId: string
}
export const ArchivedIssueAdminPanel = ({ issueId }: Props) => {
  return (
    <nav className={styles.admin_panel}>
      <LinkButton to={`/archive/edit-issue/${issueId}`}>Upravit</LinkButton>
      <Form
        method="post"
        action={`/archive/delete-issue/${issueId}`}
        className={styles.delete_button_wrapper}
      >
        <AuthenticityTokenInput />
        <Button
          type="submit"
          name={formConfig.intent.name}
          value={formConfig.intent.value.delete}
          variant={"danger"}
        >
          Smazat
        </Button>
      </Form>
    </nav>
  )
}
