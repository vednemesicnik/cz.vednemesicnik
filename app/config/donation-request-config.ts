/**
 * Sends of a verification code an hour, per IP and per address, as for the
 * membership application (log 0066).
 */
export const DONATION_VERIFICATION_SENDS_PER_IP = 10
export const DONATION_VERIFICATION_SENDS_PER_ADDRESS = 5

/** Tries of a verification code an hour, per IP. */
export const DONATION_VERIFICATION_TRIES_PER_IP = 20

/**
 * Limits on the fields, the same as the script's (`CONFIG.limits` in
 * SCRIPT__Donate__Request_Confirmation), so the donor hears about a value the
 * script would refuse at the field.
 */
export const DONATION_FIELD_LIMITS = {
  accountLength: 34,
  accounts: 10,
  city: 100,
  companyName: 200,
  email: 254,
  name: 100,
  note: 1000,
  street: 200,
} as const
