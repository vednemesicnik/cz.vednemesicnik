import { href, redirect } from 'react-router'

// The identity check is POST-only; a direct visit lands on Nastavení.
export const loader = () => redirect(href('/administration/settings'))
