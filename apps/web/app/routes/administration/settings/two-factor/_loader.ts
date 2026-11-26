import { href, redirect } from 'react-router'

// Two-factor authentication is turned on and off in dialogs on the settings
// page (design 29c, 29d); this address only keeps its action as their target.
export const loader = () => {
  throw redirect(href('/administration/settings'))
}
