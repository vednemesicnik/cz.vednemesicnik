import type { PrismaClient } from '@generated/prisma/client'
import type { AuthorRoleName, UserRoleName } from '@generated/prisma/enums'
import bcrypt from 'bcryptjs'
import { canonicalizeBackupCode } from '~/utils/backup-codes.server'
import { generateTOTP } from '~/utils/totp.server'
import { TWO_FACTOR_VERIFICATION_TYPE } from '~/utils/two-factor.server'

export type UsersData = {
  email: string
  name: string
  password: string
  userRole: UserRoleName
  authorRole: AuthorRoleName
  twoFactor?: {
    secret: string
    backupCodes: string[]
  }
}[]

/**
 * Creates the seed users with their author profiles and passwords.
 *
 * @param prisma - The Prisma client to write with.
 * @param data - The users. A user with `twoFactor` is also enrolled in TOTP with
 *   that fixed base32 secret and backup codes, so the 2FA sign-in step can be
 *   walked locally.
 */
export const createUsers = async (prisma: PrismaClient, data: UsersData) => {
  for (const user of data) {
    const createdUser = await prisma.user
      .create({
        data: {
          author: {
            create: {
              name: user.name,
              role: {
                connect: { name: user.authorRole },
              },
            },
          },
          email: user.email,
          name: user.name,
          password: {
            create: {
              hash: bcrypt.hashSync(user.password, 10),
            },
          },
          role: {
            connect: { name: user.userRole },
          },
          username: user.email,
        },
        select: { id: true },
      })
      .catch((error) => {
        console.error('Error creating a user:', error)
        return null
      })

    if (createdUser === null || user.twoFactor === undefined) continue

    // The app's TOTP defaults, so the seed enrollment matches a real one.
    const { algorithm, charSet, digits, period } = await generateTOTP({
      secret: user.twoFactor.secret,
    })

    await prisma
      .$transaction([
        prisma.verification.create({
          data: {
            algorithm,
            charSet,
            digits,
            period,
            secret: user.twoFactor.secret,
            target: createdUser.id,
            type: TWO_FACTOR_VERIFICATION_TYPE,
          },
        }),
        prisma.backupCode.createMany({
          data: user.twoFactor.backupCodes.map((code) => ({
            codeHash: bcrypt.hashSync(canonicalizeBackupCode(code), 10),
            userId: createdUser.id,
          })),
        }),
      ])
      .catch((error) => {
        console.error('Error enrolling a user in two-factor:', error)
      })
  }
}
