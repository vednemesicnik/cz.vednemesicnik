import { prisma } from '~/utils/db.server'

import { generateUsername } from './generate-username'

/**
 * Generates a unique username from a name by appending a number if needed
 * Examples:
 * - "Jan Novák" → "jan.novak" (if available)
 * - "Jan Novák" → "jan.novak2" (if "jan.novak" exists)
 * - "Jan Novák" → "jan.novak3" (if "jan.novak" and "jan.novak2" exist)
 */
export async function getUniqueUsername(name: string): Promise<string> {
  const baseUsername = generateUsername(name)
  let username = baseUsername
  let counter = 2

  // Check if username exists and increment counter until we find a unique one
  while (await isUsernameTaken(username)) {
    username = `${baseUsername}${counter}`
    counter++
  }

  return username
}

async function isUsernameTaken(username: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    select: { id: true },
    where: { username },
  })

  return user !== null
}
