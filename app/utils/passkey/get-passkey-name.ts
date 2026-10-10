type Match = {
  pattern: RegExp
  label: string
}

// First match wins: iPhone and Android UAs also mention Mac OS X and Linux.
const devices: Match[] = [
  { label: 'iPhone', pattern: /iPhone/ },
  { label: 'iPad', pattern: /iPad/ },
  { label: 'Android', pattern: /Android/ },
  { label: 'Chromebook', pattern: /CrOS/ },
  { label: 'Mac', pattern: /Macintosh/ },
  { label: 'Windows', pattern: /Windows/ },
  { label: 'Linux', pattern: /Linux/ },
]

// First match wins: Chromium browsers also send Chrome/ and Safari/.
const browsers: Match[] = [
  { label: 'Edge', pattern: /Edg\/|EdgA\/|EdgiOS\// },
  { label: 'Opera', pattern: /OPR\// },
  { label: 'Samsung Internet', pattern: /SamsungBrowser\// },
  { label: 'Firefox', pattern: /Firefox\/|FxiOS\// },
  { label: 'Chrome', pattern: /Chrome\/|CriOS\// },
  { label: 'Safari', pattern: /Safari\// },
]

const findLabel = (matches: Match[], userAgent: string) =>
  matches.find((match) => match.pattern.test(userAgent))?.label

/**
 * Names a passkey after the device and browser that registered it
 * (`iPhone, Safari`, design 29a). Chrome's reduced User-Agent hides the
 * Android model and iPadOS Safari reports a Mac, so those names are generic.
 *
 * @param userAgent - The registration request's `User-Agent` header.
 * @returns The device and browser joined with a comma, whichever were
 *   recognised, or `null` when neither was.
 */
export const getPasskeyName = (userAgent: string | null): string | null => {
  if (userAgent === null) return null

  const parts = [
    findLabel(devices, userAgent),
    findLabel(browsers, userAgent),
  ].filter((part) => part !== undefined)

  return parts.length === 0 ? null : parts.join(', ')
}
