import { createHash } from 'node:crypto'

export function getContentHash(content: string) {
  return createHash('sha256').update(content).digest('hex')
}
