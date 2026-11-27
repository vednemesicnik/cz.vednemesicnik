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
    const reportError = vi.fn()
    const publikace = startPublikace({
      environment: ENVIRONMENT,
      load: async () => create,
      reportError,
    })

    const response = await publikace.fetch(new Request(REQUEST_URL))

    expect(await response.text()).toBe('publikace')
    expect(create).toHaveBeenCalledWith(
      { NODE_ENV: 'production' },
      { reportError },
    )
  })

  test('answers 503, logs and reports once when the start rejects', async () => {
    const failure = new Error(
      'Chybí povinná proměnná prostředí SESSION_SECRET.',
    )
    const logError = vi.fn()
    const reportError = vi.fn()
    const publikace = startPublikace({
      environment: ENVIRONMENT,
      load: async () => async () => {
        throw failure
      },
      logError,
      reportError,
    })

    const first = await publikace.fetch(new Request(REQUEST_URL))
    const second = await publikace.fetch(new Request(REQUEST_URL))

    expect(first.status).toBe(503)
    expect(second.status).toBe(503)
    expect(logError).toHaveBeenCalledOnce()
    expect(reportError).toHaveBeenCalledExactlyOnceWith(failure, 'startup')
  })

  test('answers 503 without loading Publikace when the host refuses it', async () => {
    const load = vi.fn()
    const logError = vi.fn()
    const reportError = vi.fn()
    const publikace = startPublikace({
      environment: { environment: null, refusal: 'NODE_ENV is unset on Fly' },
      load,
      logError,
      reportError,
    })

    const response = await publikace.fetch(new Request(REQUEST_URL))

    expect(response.status).toBe(503)
    expect(load).not.toHaveBeenCalled()
    expect(logError).toHaveBeenCalledWith(
      '[publikace] not started: NODE_ENV is unset on Fly',
    )
    expect(reportError).toHaveBeenCalledExactlyOnceWith(
      new Error('Publikace not started: NODE_ENV is unset on Fly'),
      'startup',
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
