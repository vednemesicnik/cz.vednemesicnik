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
]
