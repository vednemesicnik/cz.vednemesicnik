import { randomInt } from 'node:crypto'

import { CODE_ALPHABET } from '~/config/membership-application-config'

const randomCharacters = (count: number) =>
  Array.from(
    { length: count },
    () => CODE_ALPHABET[randomInt(CODE_ALPHABET.length)],
  ).join('')

/**
 * The application code, e.g. `VDM-7K3Q-2P` (design 15d). It is also the
 * idempotency key the script stores an application under.
 */
export const generateApplicationCode = (): string =>
  `VDM-${randomCharacters(4)}-${randomCharacters(2)}`
