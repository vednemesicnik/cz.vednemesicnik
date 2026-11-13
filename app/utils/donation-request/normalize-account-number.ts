/**
 * An account number as the request stores it: without whitespace and in capitals, so an IBAN
 * typed in groups (`sk31 1200 …`) reads `SK311200…`. A Czech number has no letters, so only its
 * stray spaces go.
 */
export const normalizeAccountNumber = (accountNumber: string) =>
  accountNumber.replace(/\s/g, '').toUpperCase()
