import type { UsersData } from '~~/utils/create-users'

export const usersData = [
  {
    authorRole: 'coordinator',
    email: 'owner@local.dev',
    name: 'Vedneměsíčník, z. s.',
    password: 'owner',
    userRole: 'owner',
  } as const,
  {
    authorRole: 'coordinator',
    email: 'administrator@local.dev',
    name: 'Administrator',
    password: 'administrator',
    userRole: 'administrator',
  } as const,
  {
    authorRole: 'coordinator',
    email: 'coordinator@local.dev',
    name: 'Coordinator',
    password: 'coordinator',
    userRole: 'member',
  } as const,
  {
    authorRole: 'creator',
    email: 'creator@local.dev',
    name: 'Creator',
    password: 'creator',
    userRole: 'member',
  } as const,
  {
    authorRole: 'contributor',
    email: 'contributor@local.dev',
    name: 'Contributor',
    password: 'contributor',
    userRole: 'member',
  } as const,
] satisfies UsersData
