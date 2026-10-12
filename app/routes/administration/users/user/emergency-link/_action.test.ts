import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'

const { checkCSRF, issueEmergencySignInLink, recordAuditLog, userFindUnique } =
  vi.hoisted(() => ({
    checkCSRF: vi.fn(),
    issueEmergencySignInLink: vi.fn(),
    recordAuditLog: vi.fn(),
    userFindUnique: vi.fn(),
  }))

vi.mock('~/utils/csrf.server', () => ({ checkCSRF }))
vi.mock('~/utils/audit-log.server', () => ({ recordAuditLog }))
vi.mock('~/utils/db.server', () => ({
  prisma: { user: { findUnique: userFindUnique } },
}))
vi.mock(
  '~/utils/emergency-sign-in-link/issue-emergency-sign-in-link.server',
  () => ({ issueEmergencySignInLink }),
)
vi.mock(
  '~/utils/permissions/user/context/get-user-permission-context.server',
  () => ({
    getUserPermissionContext: async () => ({
      can: () => ({ hasAny: true, hasOwn: false, hasPermission: true }),
      userId: 'admin',
    }),
  }),
)

import { action } from './_action'

type ActionResult = { data: { status: string }; init: ResponseInit | null }

const issue = async (
  { userId = 'member', fields = { identityConfirmed: 'on' } } = {} as {
    userId?: string
    fields?: Record<string, string>
  },
) => {
  const body = new FormData()
  for (const [name, value] of Object.entries(fields)) body.append(name, value)

  return (await action({
    params: { userId },
    request: new Request(
      `https://test.local/administration/users/${userId}/emergency-link`,
      { body, method: 'POST' },
    ),
  } as unknown as Parameters<typeof action>[0])) as unknown as ActionResult
}

describe('issuing an emergency link', () => {
  beforeEach(() => {
    vi.stubEnv('ALLOW_PASSWORD_SIGN_IN', 'true')
    vi.stubEnv('BASE_URL', 'https://vednemesicnik.cz')
    checkCSRF.mockResolvedValue(null)
    userFindUnique.mockImplementation(
      async ({ where }: { where: { id: string } }) => ({
        id: where.id,
        role: { level: where.id === 'owner' ? 1 : 3 },
      }),
    )
    issueEmergencySignInLink.mockResolvedValue({
      expiresAt: new Date('2026-10-12T12:35:00.000Z'),
      token: 'token',
    })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.clearAllMocks()
  })

  test('with the switch off, the action does not exist', async () => {
    vi.stubEnv('ALLOW_PASSWORD_SIGN_IN', '')

    const result = await issue()

    expect(result.init?.status).toBe(404)
    expect(issueEmergencySignInLink).not.toHaveBeenCalled()
  })

  test('issues the link and records who issued it for whom', async () => {
    const result = await issue()

    expect(result.data).toMatchObject({
      expiresAt: '14:35',
      status: 'issued',
      url: 'https://vednemesicnik.cz/administration/sign-in/emergency-link/verify?token=token',
    })
    expect(issueEmergencySignInLink).toHaveBeenCalledWith({
      issuedById: 'admin',
      userId: 'member',
    })
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: 'admin',
        event: 'emergency_link_issued',
        targetId: 'member',
      }),
    )
  })

  test('creates no link before the identity check is ticked', async () => {
    const result = await issue({ fields: {} })

    expect(result.init?.status).toBe(400)
    expect(issueEmergencySignInLink).not.toHaveBeenCalled()
  })

  test('refuses the own account and the Owner as not found', async () => {
    expect((await issue({ userId: 'admin' })).init?.status).toBe(404)
    expect((await issue({ userId: 'owner' })).init?.status).toBe(404)
    expect(issueEmergencySignInLink).not.toHaveBeenCalled()
  })
})
