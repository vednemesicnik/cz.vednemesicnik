import { describe, expect, test } from 'vitest'

import { publikaceEnvironment } from './publikace-environment.ts'

describe('publikaceEnvironment', () => {
  test('hands over the PUBLIKACE_ variables by their own names', () => {
    const result = publikaceEnvironment({
      NODE_ENV: 'production',
      PUBLIKACE_APP_ORIGIN: 'https://publikace.vednemesicnik.test',
      PUBLIKACE_SESSION_SECRET: 'publikace-secret',
    })

    expect(result).toEqual({
      environment: {
        APP_ORIGIN: 'https://publikace.vednemesicnik.test',
        NODE_ENV: 'production',
        SESSION_SECRET: 'publikace-secret',
      },
      refusal: null,
    })
  })

  test("leaves out the web's variables of the same name", () => {
    const { environment } = publikaceEnvironment({
      GOOGLE_CLIENT_ID: 'web-client',
      NODE_ENV: 'production',
      SESSION_SECRET: 'web-secret',
    })

    expect(environment).toEqual({ NODE_ENV: 'production' })
  })

  test('takes NODE_ENV from the process, never from PUBLIKACE_NODE_ENV', () => {
    const { environment } = publikaceEnvironment({
      NODE_ENV: 'production',
      PUBLIKACE_NODE_ENV: 'development',
    })

    expect(environment?.NODE_ENV).toBe('production')
  })

  test('refuses anything but production on Fly', () => {
    const result = publikaceEnvironment({
      FLY_APP_NAME: 'cz-vednemesicnik',
      NODE_ENV: 'development',
      PUBLIKACE_SESSION_SECRET: 'publikace-secret',
    })

    expect(result).toEqual({
      environment: null,
      refusal: 'NODE_ENV is development on Fly, not production',
    })
  })

  test('starts outside production off Fly', () => {
    const { refusal } = publikaceEnvironment({ NODE_ENV: 'development' })

    expect(refusal).toBeNull()
  })
})
