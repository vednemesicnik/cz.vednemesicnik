/** The largest signed declaration the script stores (design 15d, #394). */
export const MAX_DECLARATION_BYTES = 8 * 1024 * 1024

import { VERIFICATION_CODE_ALPHABET } from './email-verification-config'

/**
 * The characters of the application code, the verification code's: without
 * 0/O and 1/I/L, which get mixed up when a code is read out or retyped.
 */
export const CODE_ALPHABET = VERIFICATION_CODE_ALPHABET

/**
 * Sends of a verification code an hour: per IP, protecting the script, and
 * per address, protecting a mailbox from someone else's form (log 0066).
 */
export const VERIFICATION_SENDS_PER_IP = 10
export const VERIFICATION_SENDS_PER_ADDRESS = 5

/** Tries of a verification code an hour, per IP. */
export const VERIFICATION_TRIES_PER_IP = 20
