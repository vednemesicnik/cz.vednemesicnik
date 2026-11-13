/**
 * The verification code as the app compares it. The e-mail shows eight
 * characters (`K7M29XQP`), and people type it in lower case, split by a space
 * or with a hyphen.
 *
 * @param value - What was typed.
 * @returns The value in upper case without spaces and hyphens.
 */
export const normalizeVerificationCode = (value: string): string =>
  value.replace(/[\s-]/g, '').toUpperCase()
