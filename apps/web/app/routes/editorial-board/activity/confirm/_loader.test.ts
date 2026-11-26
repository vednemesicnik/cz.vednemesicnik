import { createHmac } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { postEditorialBoardMembershipWrite } from '~/utils/editorial-board-membership.server'

import { loader } from './_loader'

vi.mock('~/utils/editorial-board-membership.server', () => ({
  postEditorialBoardMembershipWrite: vi.fn(),
}))
vi.mock('~/utils/honeypot.server', () => ({
  getHoneypotInputProps: () => ({ nameFieldName: 'name' }),
}))

const SECRET = 'test-link-secret'
const PATH = 'http://localhost/editorial-board/activity/confirm'
// The start of 24 Nov 2026 in Prague.
const EXP = Date.parse('2026-11-23T23:00:00Z') / 1000

const tokenFor = (payload: unknown) => {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return `${encoded}.${createHmac('sha256', SECRET).update(encoded).digest('hex')}`
}

const TOKEN = tokenFor({ action: 'leave', email: 'anna@local.dev', exp: EXP })

const run = (search: string) =>
  loader({ request: new Request(`${PATH}${search}`) } as never)

describe('activity confirmation loader', () => {
  beforeEach(() => {
    vi.stubEnv('GAS_EDITORIAL_BOARD_LINK_SECRET', SECRET)
    vi.useFakeTimers({ now: Date.parse('2026-11-10T12:00:00Z') })
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.useRealTimers()
  })

  it('shows the choice and the address, and writes nothing', async () => {
    await expect(run(`?token=${TOKEN}`)).resolves.toEqual({
      action: 'leave',
      email: 'anna@local.dev',
      honeypotInputProps: { nameFieldName: 'name' },
      status: 'valid',
      token: TOKEN,
    })
    expect(postEditorialBoardMembershipWrite).not.toHaveBeenCalled()
  })

  it('names the last day an expired link worked, the day before it stopped', async () => {
    vi.setSystemTime(EXP * 1000)

    await expect(run(`?token=${TOKEN}`)).resolves.toEqual({
      action: 'leave',
      lastDay: '23. 11. 2026',
      status: 'expired',
    })
  })

  it.each([
    ['no token', ''],
    [
      'a changed character',
      `?token=${TOKEN.replace(/.$/, (last) => (last === 'a' ? 'b' : 'a'))}`,
    ],
  ])('says nothing more than unusable for %s', async (_case, search) => {
    await expect(run(search)).resolves.toEqual({ status: 'invalid' })
  })

  it('treats every link as unusable without the secret', async () => {
    vi.stubEnv('GAS_EDITORIAL_BOARD_LINK_SECRET', '')

    await expect(run(`?token=${TOKEN}`)).resolves.toEqual({ status: 'invalid' })
  })
})
