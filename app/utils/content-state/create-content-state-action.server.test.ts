import { isRouteErrorResponse } from 'react-router'
import { describe, expect, test, vi } from 'vitest'

import { FORM_CONFIG } from '~/config/form-config'

import { runContentStateAction } from './create-content-state-action.server'
import type { ContentStateHandlers } from './create-content-state-handlers.server'

// CSRF is validated elsewhere; make it a no-op so these tests focus on dispatch.
const { validateCSRFMock } = vi.hoisted(() => ({
  validateCSRFMock: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/utils/csrf.server', () => ({
  validateCSRF: validateCSRFMock,
}))

const INTENT_NAME = FORM_CONFIG.intent.name
const INTENT_VALUE = FORM_CONFIG.intent.value

const createHandlers = (): ContentStateHandlers => ({
  archive: vi.fn().mockResolvedValue(undefined),
  changePublishedAt: vi.fn().mockResolvedValue(undefined),
  delete: vi.fn().mockResolvedValue(undefined),
  publish: vi.fn().mockResolvedValue(undefined),
  restore: vi.fn().mockResolvedValue(undefined),
  retract: vi.fn().mockResolvedValue(undefined),
  review: vi.fn().mockResolvedValue(undefined),
})

const target = { authorIds: ['author-1'], state: 'draft' as const }

const buildRequest = (fields: Record<string, string>) => {
  const formData = new FormData()
  for (const [name, value] of Object.entries(fields)) {
    formData.append(name, value)
  }
  return new Request('https://test.local/', { body: formData, method: 'POST' })
}

const run = (
  fields: Record<string, string>,
  overrides: Partial<Parameters<typeof runContentStateAction>[1]> = {},
) => {
  const handlers = createHandlers()
  const options = {
    deleteRedirectTo: '/administration/articles',
    handlers,
    id: 'a1',
    loadTarget: vi.fn().mockResolvedValue(target),
    ...overrides,
  }
  return {
    handlers,
    options,
    result: runContentStateAction(buildRequest(fields), options),
  }
}

describe('runContentStateAction — dispatch', () => {
  test('routes each intent to its handler with the loaded target', async () => {
    const cases: [string, keyof ContentStateHandlers][] = [
      [INTENT_VALUE.archive, 'archive'],
      [INTENT_VALUE.restore, 'restore'],
      [INTENT_VALUE.retract, 'retract'],
      [INTENT_VALUE.review, 'review'],
      [INTENT_VALUE.publish, 'publish'],
    ]

    for (const [intent, handlerName] of cases) {
      const { handlers, result } = run({ [INTENT_NAME]: intent })
      await result
      expect(handlers[handlerName]).toHaveBeenCalledWith(
        expect.any(Request),
        expect.objectContaining({ id: 'a1', target }),
      )
    }
  })

  test('parses the publishedAt field on publish', async () => {
    const { handlers, result } = run({
      [INTENT_NAME]: INTENT_VALUE.publish,
      publishedAt: '2024-05-05T00:00:00.000Z',
    })
    await result

    expect(handlers.publish).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({
        publishedAt: new Date('2024-05-05T00:00:00.000Z'),
      }),
    )
  })

  test('leaves publishedAt undefined when the field is empty', async () => {
    const { handlers, result } = run({
      [INTENT_NAME]: INTENT_VALUE.publish,
      publishedAt: '',
    })
    await result

    expect(handlers.publish).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({ publishedAt: undefined }),
    )
  })
})

describe('runContentStateAction — delete redirect', () => {
  test('redirects after delete when the redirect flag is set', async () => {
    const { handlers, result } = run({
      [INTENT_NAME]: INTENT_VALUE.delete,
      [FORM_CONFIG.redirect.name]: 'true',
    })

    await expect(result).rejects.toSatisfy(
      (thrown: unknown) =>
        isRouteErrorResponse(thrown) === false &&
        thrown instanceof Response &&
        thrown.status === 302 &&
        thrown.headers.get('location') === '/administration/articles',
    )
    expect(handlers.delete).toHaveBeenCalled()
  })

  test('does not redirect after delete without the flag', async () => {
    const { handlers, result } = run({ [INTENT_NAME]: INTENT_VALUE.delete })

    await expect(result).resolves.toBeUndefined()
    expect(handlers.delete).toHaveBeenCalled()
  })
})

describe('runContentStateAction — changePublishedAt gating', () => {
  test('dispatches when the entity supports it', async () => {
    const { handlers, result } = run(
      {
        [INTENT_NAME]: INTENT_VALUE.changePublishedAt,
        publishedAt: '2024-05-05T00:00:00.000Z',
      },
      { supportsChangePublishedAt: true },
    )
    await result

    expect(handlers.changePublishedAt).toHaveBeenCalledWith(
      expect.any(Request),
      expect.objectContaining({
        publishedAt: new Date('2024-05-05T00:00:00.000Z'),
      }),
    )
  })

  test('rejects the intent when the entity does not support it', async () => {
    const { handlers, result } = run({
      [INTENT_NAME]: INTENT_VALUE.changePublishedAt,
      publishedAt: '2024-05-05T00:00:00.000Z',
    })

    await expect(result).rejects.toThrow('Invalid intent')
    expect(handlers.changePublishedAt).not.toHaveBeenCalled()
  })
})

describe('runContentStateAction — validation', () => {
  test('throws on an unknown intent', async () => {
    const { result } = run({ [INTENT_NAME]: 'nonsense' })
    await expect(result).rejects.toThrow('Invalid intent: nonsense')
  })

  test('throws when the intent is missing', async () => {
    const { result } = run({})
    await expect(result).rejects.toBeInstanceOf(Response)
  })
})
