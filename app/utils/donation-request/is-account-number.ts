const CZECH_ACCOUNT_NUMBER = /^[\d\-/]+$/
const IBAN = /^[A-Z]{2}\d{2}[A-Z\d]{11,30}$/

/**
 * Whether a normalized account number has the shape of a Czech account number (digits, dash,
 * slash) or of an IBAN. The shape only: no check digit is verified, since the number only
 * matches the request to a payment on the statement. The script's `accountsPattern` holds the
 * same two shapes.
 */
export const isAccountNumber = (accountNumber: string) =>
  CZECH_ACCOUNT_NUMBER.test(accountNumber) || IBAN.test(accountNumber)
