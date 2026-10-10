import { href, redirect } from 'react-router'

// Passkeys are listed and removed on the settings page (design 29a, 29d); this
// address only keeps its action as the remove dialog's target.
export const loader = () => {
  throw redirect(href('/administration/settings'))
}
