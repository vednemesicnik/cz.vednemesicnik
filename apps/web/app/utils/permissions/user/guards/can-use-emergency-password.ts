/**
 * Lowest-authority user role that may set up the emergency password sign-in.
 * Role levels are inverted (lower number = higher authority): Owner is 1,
 * Administrator 2, Member 3.
 */
const EMERGENCY_PASSWORD_ROLE_LEVEL = 2

/**
 * Whether a user role may set a password and two-factor authentication, the
 * emergency sign-in path (design 29a: Owner and Administrator only, whether or
 * not password sign-in is switched on).
 *
 * @param roleLevel - The signed-in user's role level.
 * @returns `true` for Owner and Administrator.
 */
export const canUseEmergencyPassword = (roleLevel: number): boolean =>
  roleLevel <= EMERGENCY_PASSWORD_ROLE_LEVEL
