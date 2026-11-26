import { beforeEach, describe, expect, it, vi } from 'vitest'

import { consumeEnrolmentToken } from '~/utils/editorial-board-enrolment/consume-enrolment-token.server'
import { findEnrolmentByToken } from '~/utils/editorial-board-enrolment/find-enrolment-by-token.server'
import { postEditorialBoardMembershipWrite } from '~/utils/editorial-board-membership.server'

import { loader } from './_loader'

vi.mock(
  '~/utils/editorial-board-enrolment/find-enrolment-by-token.server',
  () => ({ findEnrolmentByToken: vi.fn() }),
)
vi.mock(
  '~/utils/editorial-board-enrolment/consume-enrolment-token.server',
  () => ({ consumeEnrolmentToken: vi.fn() }),
)
vi.mock('~/utils/editorial-board-membership.server', () => ({
  postEditorialBoardMembershipWrite: vi.fn(),
}))
vi.mock('~/utils/honeypot.server', () => ({
  getHoneypotInputProps: () => ({ nameFieldName: 'name' }),
}))

const findMock = vi.mocked(findEnrolmentByToken)

const PATH = 'http://localhost/editorial-board/enrolment/confirm'

const run = (search = '?token=token') =>
  loader({ request: new Request(`${PATH}${search}`) } as never)

describe('enrolment confirmation loader', () => {
  beforeEach(() => {
    findMock.mockReset()
  })

  it('shows what is being confirmed, and neither writes nor spends the token', async () => {
    findMock.mockResolvedValue({
      email: 'tereza@local.dev',
      payload: {
        formSubmittedAt: '2026-11-03T10:00:00.000Z',
        interest: 'psaní',
        name: 'Tereza Malá',
        phone: '+420 600 000 000',
      },
    })

    await expect(run()).resolves.toMatchObject({
      details: {
        email: 'tereza@local.dev',
        interest: 'psaní',
        name: 'Tereza Malá',
      },
      status: 'valid',
      token: 'token',
    })

    expect(findMock).toHaveBeenCalledExactlyOnceWith('token')
    expect(postEditorialBoardMembershipWrite).not.toHaveBeenCalled()
    expect(consumeEnrolmentToken).not.toHaveBeenCalled()
  })

  it('answers the same for an unknown, expired or spent token', async () => {
    findMock.mockResolvedValue(null)

    await expect(run()).resolves.toEqual({ status: 'invalid' })
  })

  it('answers the same for an address without a token, and looks nothing up', async () => {
    await expect(run('')).resolves.toEqual({ status: 'invalid' })

    expect(findMock).not.toHaveBeenCalled()
  })
})
