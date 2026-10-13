import { afterEach, describe, expect, test, vi } from 'vitest'

import { publishContentEvent } from './publish-content-event.server'

const { publishMock } = vi.hoisted(() => ({ publishMock: vi.fn() }))

vi.mock('./broadcaster.server', () => ({
  broadcaster: { publish: publishMock },
}))

const actor = { authorId: 'author-1', authorName: 'Jakub Novák' }

describe('publishContentEvent', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('publishes the event with its actor and time to the admin topic', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-13T12:02:00.000Z'))

    publishContentEvent(
      { change: 'review', entity: 'article', entityId: 'a1' },
      actor,
    )

    const [topic, message] = publishMock.mock.lastCall ?? []

    expect(topic).toBe('admin')
    expect(message.event).toBe('content-change')
    expect(JSON.parse(message.data)).toEqual({
      actor: { authorId: 'author-1', name: 'Jakub Novák' },
      change: 'review',
      entity: 'article',
      entityId: 'a1',
      occurredAt: '2026-10-13T12:02:00.000Z',
    })
  })

  test('swallows a broadcaster failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    publishMock.mockImplementationOnce(() => {
      throw new Error('broken')
    })

    expect(() =>
      publishContentEvent(
        { change: 'publish', entity: 'issue', entityId: 'i1' },
        actor,
      ),
    ).not.toThrow()
  })
})
