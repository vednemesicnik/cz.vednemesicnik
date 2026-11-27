import { describe, expect, test, vi } from 'vitest'

import { type PublikaceApp, startPublikace } from './start-publikace.ts'

// Promise.withResolvers, which the host's ES2022 lib doesn't type.
const deferred = <T>() => {
  let resolve: (value: T) => void = () => {}
  const promise = new Promise<T>((settle) => {
    resolve = settle
  })
  return { promise, resolve }
}

const REQUEST_URL = 'http://publikace.localhost/sign-in'
const ENVIRONMENT = {
  environment: { NODE_ENV: 'production' },
  refusal: null,
} as const

const runningApp = (): PublikaceApp => ({
  close: vi.fn(async () => {}),
  fetch: vi.fn(async () => new Response('publikace')),
})

describe('startPublikace', () => {
  test('hands each request to Publikace once it has started', async () => {
    const app = runningApp()
    const create = vi.fn(async () => app)
    const publikace = startPublikace({
      environment: ENVIRONMENT,
      load: async () => create,
    })

    const response = await publikace.fetch(new Request(REQUEST_URL))

    expect(await response.text()).toBe('publikace')
    expect(create).toHaveBeenCalledWith({ NODE_ENV: 'production' })
  })

  test('answers 503 and logs once when the start rejects', async () => {
    const logError = vi.fn()
    const publikace = startPublikace({
      environment: ENVIRONMENT,
      load: async () => async () => {
        throw new Error('Chybí povinná proměnná prostředí SESSION_SECRET.')
      },
      logError,
    })

    const first = await publikace.fetch(new Request(REQUEST_URL))
    const second = await publikace.fetch(new Request(REQUEST_URL))

    expect(first.status).toBe(503)
    expect(second.status).toBe(503)
    expect(logError).toHaveBeenCalledOnce()
  })

  test('answers 503 without loading Publikace when the host refuses it', async () => {
    const load = vi.fn()
    const logError = vi.fn()
    const publikace = startPublikace({
      environment: { environment: null, refusal: 'NODE_ENV is unset on Fly' },
      load,
      logError,
    })

    const response = await publikace.fetch(new Request(REQUEST_URL))

    expect(response.status).toBe(503)
    expect(load).not.toHaveBeenCalled()
    expect(logError).toHaveBeenCalledWith(
      '[publikace] not started: NODE_ENV is unset on Fly',
    )
  })

  test('holds a request until the start finishes', async () => {
    const app = runningApp()
    const { promise, resolve } = deferred<PublikaceApp>()
    const publikace = startPublikace({
      environment: ENVIRONMENT,
      load: async () => () => promise,
    })

    const pending = publikace.fetch(new Request(REQUEST_URL))
    resolve(app)

    expect((await pending).status).toBe(200)
  })

  test('closes Publikace after a start still under way', async () => {
    const app = runningApp()
    const { promise, resolve } = deferred<PublikaceApp>()
    const publikace = startPublikace({
      environment: ENVIRONMENT,
      load: async () => () => promise,
    })

    const closing = publikace.close()
    resolve(app)
    await closing

    expect(app.close).toHaveBeenCalledOnce()
  })

  test('closes nothing after a failed start', async () => {
    const publikace = startPublikace({
      environment: ENVIRONMENT,
      load: async () => {
        throw new Error('missing module')
      },
      logError: vi.fn(),
    })

    await expect(publikace.close()).resolves.toBeUndefined()
  })
})
