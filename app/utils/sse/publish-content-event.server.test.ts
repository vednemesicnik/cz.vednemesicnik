import { describe, expect, test, vi } from 'vitest'

import { publishContentEvent } from './publish-content-event.server'

const { publishMock } = vi.hoisted(() => ({ publishMock: vi.fn() }))

vi.mock('./broadcaster.server', () => ({
  broadcaster: { publish: publishMock },
}))

describe('publishContentEvent', () => {
  test('publishes the event to the admin topic', () => {
    publishContentEvent({
      change: 'review',
      entity: 'article',
      entityId: 'a1',
    })

    expect(publishMock).toHaveBeenCalledWith('admin', {
      data: '{"change":"review","entity":"article","entityId":"a1"}',
      event: 'content-change',
    })
  })

  test('swallows a broadcaster failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    publishMock.mockImplementationOnce(() => {
      throw new Error('broken')
    })

    expect(() =>
      publishContentEvent({
        change: 'publish',
        entity: 'issue',
        entityId: 'i1',
      }),
    ).not.toThrow()
  })
})
