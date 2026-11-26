/** The largest signed declaration the script stores (design 15d, #394). */
export const MAX_DECLARATION_BYTES = 8 * 1024 * 1024

/**
 * The characters of the application code and the verification code: without
 * 0/O and 1/I/L, which get mixed up when a code is read out or retyped.
 */
export const CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/** The code that confirms the applicant's address (#972, design 15k). */
export const VERIFICATION_CODE_LENGTH = 8

/** How long a verification code works after it is sent (design 15k). */
export const VERIFICATION_CODE_LIFETIME_MILLISECONDS = 24 * 60 * 60 * 1000

/**
 * Sends of a verification code an hour: per IP, protecting the script, and
 * per address, protecting a mailbox from someone else's form (log 0066).
 */
export const VERIFICATION_SENDS_PER_IP = 10
export const VERIFICATION_SENDS_PER_ADDRESS = 5

/** Tries of a verification code an hour, per IP. */
export const VERIFICATION_TRIES_PER_IP = 20

export const VERIFICATION_LIMIT_WINDOW_MILLISECONDS = 60 * 60 * 1000
