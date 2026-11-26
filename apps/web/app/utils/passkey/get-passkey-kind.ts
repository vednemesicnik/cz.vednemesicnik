import type { PasskeyKind } from '@generated/prisma/enums'

type RegistrationAttachment = {
  authenticatorAttachment: unknown
  transports: string[] | undefined
}

/**
 * Tells where a new passkey lives (design 29a): built into the device, on a
 * phone or tablet added via QR code, or on a security key. The attachment
 * decides, because transports alone can't: a built-in iPhone passkey reports
 * `hybrid` too. The browser reports the attachment unsigned, which is fine
 * here: it only picks a label and grants nothing.
 *
 * @param registration - `authenticatorAttachment` from the registration
 * response and the transports of the verified credential.
 * @returns The kind, or `null` when the browser reported no attachment.
 */
export const getPasskeyKind = ({
  authenticatorAttachment,
  transports,
}: RegistrationAttachment): PasskeyKind | null => {
  if (authenticatorAttachment === 'platform') {
    return 'built_in'
  }

  if (authenticatorAttachment !== 'cross-platform') {
    return null
  }

  return transports?.includes('hybrid') === true ? 'phone' : 'security_key'
}
