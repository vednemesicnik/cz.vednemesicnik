import { href, redirect } from 'react-router'

// The password is changed in a dialog on the settings page (design 29d); this
// address only keeps its action as the dialog's target.
export const loader = () => {
  throw redirect(href('/administration/settings'))
}
