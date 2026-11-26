export type DeclarationType = 'application/pdf' | 'image/jpeg' | 'image/png'

const SIGNATURES: [DeclarationType, number[]][] = [
  ['application/pdf', [0x25, 0x50, 0x44, 0x46]],
  ['image/jpeg', [0xff, 0xd8, 0xff]],
  ['image/png', [0x89, 0x50, 0x4e, 0x47]],
]

/**
 * Tells a scan's type from its first bytes, because neither a file's name nor
 * the type its browser declares says what it holds.
 *
 * @param bytes - The file, or at least its first four bytes.
 * @returns The type, or `null` when it is no PDF, JPEG or PNG.
 */
export const detectDeclarationType = (
  bytes: Uint8Array,
): DeclarationType | null => {
  const match = SIGNATURES.find(([, signature]) =>
    signature.every((byte, index) => bytes[index] === byte),
  )

  return match === undefined ? null : match[0]
}
