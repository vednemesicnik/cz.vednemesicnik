/**
 * The characters of a verification code: without 0/O and 1/I/L, which get
 * mixed up when a code is read out or retyped.
 */
export const VERIFICATION_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

/** The code that confirms an address (#972, design 15k). */
export const VERIFICATION_CODE_LENGTH = 8

/** How long a verification code works after it is sent (design 15k). */
export const VERIFICATION_CODE_LIFETIME_MILLISECONDS = 24 * 60 * 60 * 1000

/** The window the sends and tries of a code are counted in. */
export const VERIFICATION_LIMIT_WINDOW_MILLISECONDS = 60 * 60 * 1000

/**
 * What a code confirms. It is part of the signed message, so a code made for
 * one form never passes in another.
 */
export type VerificationPurpose = 'donation-verify' | 'membership-verify'
