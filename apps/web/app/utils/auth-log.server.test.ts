import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authLogDeleteMany, auditLogDeleteMany, auditLogUpdateMany } =
  vi.hoisted(() => ({
    auditLogDeleteMany: vi.fn(async () => ({ count: 0 })),
    auditLogUpdateMany: vi.fn(async (_args: unknown) => ({ count: 0 })),
    authLogDeleteMany: vi.fn(async () => ({ count: 0 })),
  }))

vi.mock('~/utils/db.server', () => ({
  prisma: {
    auditLog: {
      deleteMany: auditLogDeleteMany,
      updateMany: auditLogUpdateMany,
    },
    authLog: { deleteMany: authLogDeleteMany },
    emergencySignInLink: { deleteMany: vi.fn(async () => ({ count: 0 })) },
  },
}))

import { cleanupOldAuthLogs } from './auth-log.server'

describe('cleanupOldAuthLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('clears the address on old audit logs and keeps the rows', () => {
    const before = Date.now()

    cleanupOldAuthLogs()

    expect(auditLogDeleteMany).not.toHaveBeenCalled()
    expect(auditLogUpdateMany).toHaveBeenCalledOnce()

    const ninetyDays = 90 * 24 * 60 * 60 * 1000
    const { data, where } = auditLogUpdateMany.mock.calls[0][0] as {
      data: unknown
      where: { createdAt: { lt: Date }; ipAddress: unknown }
    }

    expect(data).toEqual({ ipAddress: null })
    expect(where.ipAddress).toEqual({ not: null })
    expect(where.createdAt.lt.getTime()).toBeLessThanOrEqual(
      Date.now() - ninetyDays,
    )
    expect(where.createdAt.lt.getTime()).toBeGreaterThanOrEqual(
      before - ninetyDays,
    )
  })
})
