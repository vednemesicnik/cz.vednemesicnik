import { Form } from "@remix-run/react"
import styles from "./_archived-issue-admin-panel.module.css"
import { LinkButton } from "~/components/link-button"
import { Button } from "~/components/button"
import { formConfig } from "~/config/form-config"
import { AuthenticityTokenInput } from "remix-utils/csrf/react"

type Props = {
  issueId: string
}
export const ArchivedIssueAdminPanel = ({ issueId }: Props) => {
  return (
    <nav className={styles.admin_panel}>
      <LinkButton to={`/archive/edit-issue/${issueId}`}>Upravit</LinkButton>
      <Form method="post" action={`/archive/delete-issue/${issueId}`} className={styles.delete_button_wrapper}>
        <AuthenticityTokenInput />
        <Button
          type="submit"
          name={formConfig.submitButton.name}
          value={formConfig.submitButton.value.deleteArchivedIssue}
          variant={"danger"}
        >
          Smazat
        </Button>
      </Form>
    </nav>
  )
}
