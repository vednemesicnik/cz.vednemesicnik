type MailErrorFields = {
  mailError?: unknown
  mailerError?: unknown
}

/**
 * Reads why a script's e-mail did not go out. The scripts are moving from `mailerError`
 * to `mailError` one release at a time, so an answer may carry either name (log 0071).
 *
 * @param body - The script's answer, if there is one.
 * @returns The reason, or `undefined` when the answer holds none.
 */
export const readMailError = (
  body: MailErrorFields | undefined,
): string | undefined => {
  const mailError = body?.mailError ?? body?.mailerError

  return typeof mailError === 'string' ? mailError : undefined
}
