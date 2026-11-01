import { randomInt } from 'node:crypto'

// Without 0/O and 1/I/L, which get mixed up when a code is read out or retyped.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

const randomCharacters = (count: number) =>
  Array.from(
    { length: count },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join('')

/**
 * The application code, e.g. `VDM-7K3Q-2P` (design 15d). It is also the
 * idempotency key the script stores an application under.
 */
export const generateApplicationCode = (): string =>
  `VDM-${randomCharacters(4)}-${randomCharacters(2)}`
