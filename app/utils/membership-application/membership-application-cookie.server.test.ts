import { beforeAll, describe, expect, it, vi } from 'vitest'

import type { MembershipApplicationState } from './read-membership-application-cookie.server'

const DETAILS_STATE: MembershipApplicationState = {
  code: 'VDM-7K3Q-2P',
  details: {
    address: 'Lannova 12, 370 01 České Budějovice',
    dateOfBirth: '2009-05-14',
    email: 'tereza@local.dev',
    firstName: 'Tereza',
    lastName: 'Malá',
    phone: '604 123 456',
  },
  state: 'details',
}

const SENT_STATE: MembershipApplicationState = {
  code: 'VDM-7K3Q-2P',
  email: 'tereza@local.dev',
  state: 'sent',
}

describe('membership application cookie', () => {
  let read: typeof import('./read-membership-application-cookie.server').readMembershipApplicationCookie
  let write: typeof import('./write-membership-application-cookie.server').writeMembershipApplicationCookie

  beforeAll(async () => {
    // The cookie reads its secret once, when its module loads.
    vi.stubEnv('SESSION_SECRET', 'test-secret')
    read = (await import('./read-membership-application-cookie.server'))
      .readMembershipApplicationCookie
    write = (await import('./write-membership-application-cookie.server'))
      .writeMembershipApplicationCookie
  })

  const requestWith = (cookie: string) =>
    new Request('http://localhost/', { headers: { Cookie: cookie } })

  const cookieValue = (setCookie: string) => setCookie.split(';')[0]

  it('round-trips the details', async () => {
    const setCookie = await write(DETAILS_STATE)
    const state = await read(requestWith(cookieValue(setCookie)))
    expect(state).toEqual(DETAILS_STATE)
  })

  it('round-trips details without a phone', async () => {
    const { phone: _phone, ...details } = DETAILS_STATE.details
    const setCookie = await write({ ...DETAILS_STATE, details })
    const state = await read(requestWith(cookieValue(setCookie)))
    expect(state).toEqual({ ...DETAILS_STATE, details })
  })

  it('round-trips the sent state', async () => {
    const setCookie = await write(SENT_STATE)
    const state = await read(requestWith(cookieValue(setCookie)))
    expect(state).toEqual(SENT_STATE)
  })

  it('keeps the details for 30 days and the sent state for an hour', async () => {
    expect(await write(DETAILS_STATE)).toContain('Max-Age=2592000')
    expect(await write(SENT_STATE)).toContain('Max-Age=3600')
  })

  it('is httpOnly, SameSite=Lax and scoped to the flow', async () => {
    const setCookie = await write(DETAILS_STATE)
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=Lax')
    expect(setCookie).toContain('Path=/organization/membership')
  })

  it('reads nothing without a cookie', async () => {
    expect(await read(new Request('http://localhost/'))).toBeNull()
  })

  it('refuses a tampered value', async () => {
    const setCookie = await write(SENT_STATE)
    const [name, value] = cookieValue(setCookie).split('=')
    const tampered = `${name}=${value.slice(0, -6)}AAAAAA`
    expect(await read(requestWith(tampered))).toBeNull()
  })

  it('refuses a signed value that no longer fits the schema', async () => {
    const { membershipApplicationCookie } = await import(
      './membership-application-cookie.server'
    )
    const setCookie = await membershipApplicationCookie.serialize({
      code: 'VDM-7K3Q-2P',
      details: { firstName: 'Tereza' },
      state: 'details',
    })
    expect(await read(requestWith(cookieValue(setCookie)))).toBeNull()
  })
})
