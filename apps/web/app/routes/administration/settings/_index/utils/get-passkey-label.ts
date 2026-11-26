import type { PasskeyKind } from '@generated/prisma/enums'

type Passkey = {
  name: string | null
  kind: PasskeyKind | null
  deviceType: string
}

type PasskeyLabel = {
  title: string
  type: string | null
}

// The kinds the app can't name a model for (design 29a).
const kindTitles: Partial<Record<PasskeyKind, string>> = {
  phone: 'Telefon nebo tablet',
  security_key: 'Bezpečnostní klíč',
}

// credentialDeviceType → row title of a passkey without a name (design 29a).
const typeTitles: Record<string, string> = {
  multiDevice: 'Synchronizovaný',
  singleDevice: 'Vázaný na zařízení',
}

// credentialDeviceType → small type under a passkey's title (design 29a).
const typeDetails: Record<string, string> = {
  multiDevice: 'synchronizovaný',
  singleDevice: 'vázaný na zařízení',
}

/**
 * Names a passkey in the Passkey row and its removal dialog (design 29a,
 * 29d): a key or a phone by its kind, a built-in passkey by its name, and a
 * passkey without either by its type.
 *
 * @param passkey - The stored name, kind and `credentialDeviceType`.
 * @returns The title, and the lowercase type for the small line, or `null`
 * when the type already is the title.
 */
export const getPasskeyLabel = ({
  name,
  kind,
  deviceType,
}: Passkey): PasskeyLabel => {
  const type = typeDetails[deviceType] ?? deviceType
  const kindTitle = kind === null ? undefined : kindTitles[kind]

  if (kindTitle !== undefined) {
    return { title: kindTitle, type }
  }

  if (name !== null) {
    return { title: name, type }
  }

  return { title: typeTitles[deviceType] ?? deviceType, type: null }
}
