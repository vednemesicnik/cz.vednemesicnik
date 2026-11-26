import { describe, expect, it } from 'vitest'

import { writeMembershipApplicationCookie } from '~/utils/membership-application/write-membership-application-cookie.server'
import { loader } from './_loader'
import type { Route } from './+types/route'

const load = async () => {
  const cookie = await writeMembershipApplicationCookie({
    code: 'VDM-ABCD-EF',
    details: {
      address: 'Lannova 12, 370 01 České Budějovice',
      dateOfBirth: '2000-05-14',
      email: 'tereza@local.dev',
      firstName: 'Tereza',
      lastName: 'Malá',
    },
    state: 'details',
  })

  return loader({
    request: new Request('http://localhost/', { headers: { cookie } }),
  } as Route.LoaderArgs)
}

describe('declaration loader', () => {
  it('shows the e-mail address as written', async () => {
    const response = await load()

    expect(await response.text()).toContain('tereza@local.dev')
  })

  it('tells Cloudflare not to rewrite the e-mail address', async () => {
    const response = await load()

    expect(response.headers.get('Cache-Control')).toContain('no-transform')
  })
})
