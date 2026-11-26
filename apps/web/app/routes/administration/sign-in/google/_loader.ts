import { redirect } from 'react-router'

// Defensive: the OAuth flow starts with a POST from the sign-in button. A direct
// GET has no state to set, so bounce back to the sign-in chooser.
export const loader = () => redirect('/administration/sign-in')
