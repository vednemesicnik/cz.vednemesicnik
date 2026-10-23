import { beforeEach, describe, expect, test, vi } from 'vitest'

import { sendUsersNotice } from '~/utils/users-notice/send-users-notice.server'

import { sendEmailChangeNotice } from './send-email-change-notice.server'

vi.mock('~/utils/users-notice/send-users-notice.server', () => ({
  sendUsersNotice: vi.fn().mockResolvedValue(true),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'info').mockImplementation(() => {})
})

describe('sendEmailChangeNotice', () => {
  test('sends the notice to the old address on the domain', async () => {
    await expect(
      sendEmailChangeNotice({
        changedByName: 'Petr Dvořák',
        newEmail: 'test@vednemesicnik.cz',
        oldEmail: 'notifications@vednemesicnik.cz',
      }),
    ).resolves.toBe(true)

    expect(sendUsersNotice).toHaveBeenCalledWith({
      changedByName: 'Petr Dvořák',
      email: 'notifications@vednemesicnik.cz',
      kind: 'email-change-notice',
      newEmail: 'test@vednemesicnik.cz',
    })
  })

  test('skips an old address off the domain', async () => {
    await expect(
      sendEmailChangeNotice({
        changedByName: 'Petr Dvořák',
        newEmail: 'test@vednemesicnik.cz',
        oldEmail: 'contributor@local.dev',
      }),
    ).resolves.toBe(false)

    expect(sendUsersNotice).not.toHaveBeenCalled()
  })
})
