import { describe, expect, test, vi } from 'vitest'

import { action } from './_action'

vi.mock('~/utils/auth.server', () => ({
  deleteSessionAuthCookieSession: vi
    .fn()
    .mockResolvedValue('vdm_auth=; Max-Age=0'),
  getSessionAuthCookieSession: vi.fn().mockResolvedValue({}),
  getSessionAuthId: vi.fn().mockReturnValue(undefined),
}))
vi.mock('~/utils/auth-log.server', () => ({ recordAuthLog: vi.fn() }))
vi.mock('~/utils/db.server', () => ({ prisma: {} }))

const signOut = async (fields: Record<string, string>, referer?: string) => {
  const formData = new FormData()
  for (const [name, value] of Object.entries(fields)) {
    formData.append(name, value)
  }

  const request = new Request('https://test.local/administration/sign-out', {
    body: formData,
    headers: referer === undefined ? {} : { Referer: referer },
    method: 'POST',
  })

  return (await action({ request } as Parameters<typeof action>[0])) as Response
}

describe('sign-out action', () => {
  test('goes to sign-in with the page it came from, whatever the Referer', async () => {
    const response = await signOut(
      { redirectTo: '/administration/articles?page=2' },
      undefined,
    )

    expect(response.status).toBe(302)
    expect(response.headers.get('Location')).toBe(
      `/administration/sign-in?${new URLSearchParams({ redirectTo: '/administration/articles?page=2' })}`,
    )
    expect(response.headers.get('Set-Cookie')).toContain('vdm_auth=')
  })

  test('goes to plain sign-in without a page', async () => {
    const response = await signOut({}, 'https://test.local/administration/x')

    expect(response.headers.get('Location')).toBe('/administration/sign-in')
  })

  test('never leaves the site', async () => {
    const response = await signOut({ redirectTo: 'https://evil.example/' })

    expect(response.headers.get('Location')).toBe('/administration/sign-in')
  })
})
