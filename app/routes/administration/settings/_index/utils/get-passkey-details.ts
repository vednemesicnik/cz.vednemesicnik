type PasskeyDetails = {
  type: string | null
  createdAt: string
  lastUsedAt: string | null
}

/**
 * Lists what the small line under a passkey's title says (design 29a):
 * „synchronizovaný · přidán 3. 9. 2026 · naposledy 25. 9. 2026“.
 *
 * @param details - `type` in lowercase, or `null` when the type is already the
 * title (a passkey without a name); the formatted `createdAt`; the formatted
 * `lastUsedAt`, or `null` for a passkey never used to sign in.
 * @returns The parts that apply, in order, for the page to join with a middle
 * dot; each part stays on one line.
 */
export const getPasskeyDetails = ({
  type,
  createdAt,
  lastUsedAt,
}: PasskeyDetails): string[] =>
  [
    type,
    `přidán ${createdAt}`,
    lastUsedAt === null ? null : `naposledy ${lastUsedAt}`,
  ].filter((part) => part !== null)
