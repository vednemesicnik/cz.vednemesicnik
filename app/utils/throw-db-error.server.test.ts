import { Prisma } from '@generated/prisma/client'
import { afterEach, describe, expect, test, vi } from 'vitest'

import { throwDbError } from '~/utils/throw-db-error.server'

const prismaMessage =
  'Unique constraint failed on the fields: (`slug`) in table `Article`'

const createKnownRequestError = () =>
  new Prisma.PrismaClientKnownRequestError(prismaMessage, {
    clientVersion: 'test',
    code: 'P2002',
  })

const catchThrown = (callback: () => unknown) => {
  try {
    callback()
  } catch (thrown) {
    return thrown
  }
  throw new Error('Expected the callback to throw')
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('throwDbError', () => {
  test('throws only the safe message and logs the Prisma details', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const thrown = catchThrown(() =>
      throwDbError(createKnownRequestError(), 'Unable to create the article.'),
    )

    expect(thrown).toBeInstanceOf(Response)
    const response = thrown as Response
    expect(response.status).toBe(400)
    expect(await response.text()).toBe('Unable to create the article.')
    expect(consoleError).toHaveBeenCalledWith(
      'Database error P2002: Unable to create the article.',
      prismaMessage,
    )
  })

  test('rethrows any other error unchanged', () => {
    const error = new Error('boom')

    expect(catchThrown(() => throwDbError(error, 'Unused.'))).toBe(error)
  })
})
