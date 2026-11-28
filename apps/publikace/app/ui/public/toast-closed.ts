/**
 * Set on a toast the person closed (`11g`): the toast's own style hides it, and the issue
 * detail's checks look for it before their reload, so that the reload draws it closed again.
 */
export const TOAST_CLOSED_ATTRIBUTE = 'data-closed'
