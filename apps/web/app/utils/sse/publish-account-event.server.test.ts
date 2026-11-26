import { afterEach, describe, expect, test, vi } from 'vitest'

import { publishAccountEvent } from './publish-account-event.server'

const { publishMock } = vi.hoisted(() => ({ publishMock: vi.fn() }))

vi.mock('./broadcaster.server', () => ({
  broadcaster: { publish: publishMock },
}))

describe('publishAccountEvent', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('publishes only the hint fields and the time to the admin topic', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-24T12:02:00.000Z'))

    publishAccountEvent({ change: 'update', entity: 'user', entityId: 'u1' })

    const [topic, message] = publishMock.mock.lastCall ?? []

    expect(topic).toBe('admin')
    expect(message.event).toBe('account-change')
    expect(JSON.parse(message.data)).toEqual({
      change: 'update',
      entity: 'user',
      entityId: 'u1',
      occurredAt: '2026-10-24T12:02:00.000Z',
    })
  })

  test('drops fields beyond the hint', () => {
    publishAccountEvent({
      change: 'delete',
      entity: 'author',
      entityId: 'a1',
      name: 'Jakub Novák',
    } as Parameters<typeof publishAccountEvent>[0])

    const [, message] = publishMock.mock.lastCall ?? []

    expect(JSON.parse(message.data)).not.toHaveProperty('name')
  })

  test('swallows a broadcaster failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    publishMock.mockImplementationOnce(() => {
      throw new Error('broken')
    })

    expect(() =>
      publishAccountEvent({
        change: 'create',
        entity: 'author',
        entityId: 'a1',
      }),
    ).not.toThrow()
  })
})
