import type { LoaderFunctionArgs } from 'react-router'

import { GOOGLE_PROVIDER_NAME } from '~/config/connection-config'
import { requireAuthentication } from '~/utils/auth.server'
import { countUnusedBackupCodes } from '~/utils/backup-codes.server'
import { prisma } from '~/utils/db.server'
import { formatNumericDate } from '~/utils/format-numeric-date'
import {
  createImageSources,
  imageSourceSelect,
} from '~/utils/image-store/create-image-sources'
import { canUseEmergencyPassword } from '~/utils/permissions/user/guards/can-use-emergency-password'
import { RECENT_AUTHENTICATION_MAX_AGE_MS } from '~/utils/recent-authentication'
import { getUserTwoFactor } from '~/utils/two-factor.server'

import { parseSettingsContinue } from './utils/parse-settings-continue'

export const loader = async ({ request, url }: LoaderFunctionArgs) => {
  const { sessionId } = await requireAuthentication({ request, url })

  const session = await prisma.session.findUniqueOrThrow({
    select: {
      createdAt: true,
      user: {
        select: {
          author: {
            select: {
              bio: true,
              name: true,
              role: { select: { name: true } },
            },
          },
          connections: {
            select: { id: true },
            where: { providerName: GOOGLE_PROVIDER_NAME },
          },
          createdAt: true,
          email: true,
          id: true,
          image: {
            select: imageSourceSelect,
          },
          passkeys: {
            orderBy: { createdAt: 'asc' },
            select: {
              createdAt: true,
              credentialDeviceType: true,
              id: true,
            },
          },
          password: { select: { userId: true } },
          role: { select: { level: true, name: true } },
          sessions: {
            select: {
              id: true,
            },
            where: {
              expirationDate: {
                gt: new Date(),
              },
              id: {
                not: sessionId,
              },
            },
          },
        },
      },
    },
    where: { id: sessionId },
  })

  const { user } = session
  const passkeyIds = user.passkeys.map((passkey) => passkey.id)

  // Password and two-factor are the emergency sign-in path: only Owner and
  // Administrator see them (design 29a), so nobody else's page loads them.
  const emergencyPassword = canUseEmergencyPassword(user.role.level)
    ? await (async () => {
        const isTwoFactorEnabled = (await getUserTwoFactor(user.id)) !== null

        return {
          hasPassword: user.password !== null,
          isTwoFactorEnabled,
          unusedBackupCodesCount: isTwoFactorEnabled
            ? await countUnusedBackupCodes(user.id)
            : 0,
        }
      })()
    : null

  return {
    emergencyPassword,
    otherSessionsCount: user.sessions.length,
    passkeys: user.passkeys.map((passkey) => ({
      createdAt: formatNumericDate(passkey.createdAt),
      deviceType: passkey.credentialDeviceType,
      id: passkey.id,
    })),
    // Until when this session may change sign-in methods without signing in
    // again; the page checks it at the moment of the click.
    recentAuthenticationExpiresAt:
      session.createdAt.getTime() + RECENT_AUTHENTICATION_MAX_AGE_MS,
    settingsContinue: parseSettingsContinue(url.searchParams, passkeyIds),
    user: {
      authorBio: user.author.bio ?? '',
      authorName: user.author.name,
      authorRoleName: user.author.role.name,
      createdAt: formatNumericDate(user.createdAt),
      email: user.email,
      hasImage: user.image !== null,
      image: {
        altText: user.image?.altText ?? '',
        sources: createImageSources('user-image', user.image),
      },
      isGoogleLinked: user.connections.length > 0,
      userRoleName: user.role.name,
    },
  }
}
