import type { UsersData } from '~~/utils/create-users'

export const users: UsersData = [
  {
    authorRole: 'coordinator',
    email: 'owner@local.dev',
    name: 'Vedneměsíčník, z. s.',
    password: 'owner',
    userRole: 'owner',
  },
  {
    authorRole: 'coordinator',
    email: 'administrator@local.dev',
    name: 'Administrator',
    password: 'administrator',
    userRole: 'administrator',
  },
  {
    authorRole: 'coordinator',
    email: 'coordinator@local.dev',
    name: 'Coordinator',
    password: 'coordinator',
    userRole: 'member',
  },
  {
    authorRole: 'creator',
    email: 'creator@local.dev',
    name: 'Creator',
    password: 'creator',
    userRole: 'member',
  },
  {
    authorRole: 'contributor',
    email: 'contributor@local.dev',
    name: 'Contributor',
    password: 'contributor',
    userRole: 'member',
  },
  // Walks the password sign-in's 2FA step locally. Add the secret to an
  // authenticator app, or run `oathtool --totp -b JBSWY3DPEHPK3PXP`.
  {
    authorRole: 'contributor',
    email: 'two-factor@local.dev',
    name: 'Two-Factor',
    password: 'two-factor',
    twoFactor: {
      backupCodes: [
        'seed-2222',
        'seed-3333',
        'seed-4444',
        'seed-5555',
        'seed-6666',
        'seed-7777',
        'seed-8888',
        'seed-9999',
        'seed-aaaa',
        'seed-bbbb',
      ],
      secret: 'JBSWY3DPEHPK3PXP',
    },
    userRole: 'member',
  },
]
