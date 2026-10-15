import { beforeEach, describe, expect, test, vi } from 'vitest'

import {
  createEditHoldHandlers,
  type EditHoldRow,
} from './create-edit-hold-handlers.server'

// Pass-through permission wrapper with a switchable signed-in author; the
// entity's Prisma work is the config's callbacks.
const mocks = vi.hoisted(() => ({
  permissionContext: vi.fn(),
  publishContentEvent: vi.fn(),
  recordContentLog: vi.fn(),
}))

vi.mock('~/utils/content-log/record-content-log.server', () => ({
  recordContentLog: mocks.recordContentLog,
}))

vi.mock('~/utils/sse/publish-content-event.server', () => ({
  publishContentEvent: mocks.publishContentEvent,
}))

vi.mock(
  '~/utils/permissions/author/actions/with-author-permission.server',
  () => ({
    withAuthorPermission: async (
      _request: Request,
      options: { execute: (context: unknown) => Promise<unknown> },
    ) => options.execute(mocks.permissionContext()),
  }),
)

const request = new Request('https://test.local/')
const CONTRIBUTOR = 3
const COORDINATOR = 1

const updatedAt = new Date('2026-10-15T12:00:00.000Z')
const minutesFromNow = (minutes: number) =>
  new Date(Date.now() + minutes * 60_000)

const freeRow: EditHoldRow = {
  authorIds: ['anna'],
  heldByAuthorId: null,
  heldByName: null,
  heldByTabId: null,
  heldSince: null,
  heldUntil: null,
  isEmpty: false,
  state: 'draft',
  submittedAt: null,
  updatedAt,
}

const heldBy = (authorId: string, tabId: string, name: string) => ({
  ...freeRow,
  heldByAuthorId: authorId,
  heldByName: name,
  heldByTabId: tabId,
  heldSince: minutesFromNow(-5),
  heldUntil: minutesFromNow(1),
})

const createConfig = (row: EditHoldRow) => ({
  deleteEmpty: vi.fn().mockResolvedValue(1),
  entity: 'article' as const,
  findHold: vi.fn().mockResolvedValue(row),
  writeHold: vi.fn().mockResolvedValue(1),
})

const signInAs = (authorId: string, roleLevel: number) =>
  mocks.permissionContext.mockReturnValue({
    authorId,
    authorName: authorId,
    roleLevel,
  })

beforeEach(() => {
  vi.clearAllMocks()
  signInAs('anna', CONTRIBUTOR)
})

describe('createEditHoldHandlers — take', () => {
  test('takes a free hold for the tab, keeping updatedAt, and announces it', async () => {
    const config = createConfig(freeRow)

    await expect(
      createEditHoldHandlers(config).take(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'holding' })

    const [id, condition, data] = config.writeHold.mock.lastCall ?? []
    expect(id).toBe('a1')
    expect(condition).toMatchObject({ holder: 'free', updatedAt })
    expect(data).toMatchObject({
      heldByAuthorId: 'anna',
      heldByTabId: 'tab-1',
      updatedAt,
    })
    // About two minutes from now.
    expect(data.heldUntil.getTime() - data.heldSince.getTime()).toBe(120_000)
    expect(mocks.publishContentEvent).toHaveBeenCalledWith(
      { change: 'hold', entity: 'article', entityId: 'a1' },
      expect.anything(),
    )
  })

  test('an expired hold is free, with no release', async () => {
    const config = createConfig({
      ...heldBy('jakub', 'tab-9', 'Jakub Novák'),
      heldUntil: minutesFromNow(-1),
    })

    await expect(
      createEditHoldHandlers(config).take(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'holding' })
    expect(config.writeHold.mock.lastCall?.[1]).toMatchObject({
      holder: 'free',
    })
  })

  test('someone else’s valid hold: nothing written, who and since', async () => {
    const row = heldBy('jakub', 'tab-9', 'Jakub Novák')
    const config = createConfig(row)

    await expect(
      createEditHoldHandlers(config).take(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({
      holder: {
        lastSavedAt: updatedAt.toISOString(),
        name: 'Jakub Novák',
        since: row.heldSince.toISOString(),
      },
      status: 'held-by-other',
    })
    expect(config.writeHold).not.toHaveBeenCalled()
  })

  test('one’s own hold in another tab asks (24g)', async () => {
    const config = createConfig(heldBy('anna', 'tab-2', 'Anna'))

    await expect(
      createEditHoldHandlers(config).take(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'own-other-tab' })
    expect(config.writeHold).not.toHaveBeenCalled()
  })

  test('reads again and retries once when a save moved updatedAt', async () => {
    const config = createConfig(freeRow)
    config.writeHold.mockResolvedValueOnce(0)

    await expect(
      createEditHoldHandlers(config).take(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'holding' })
    expect(config.findHold).toHaveBeenCalledTimes(2)
    expect(config.writeHold).toHaveBeenCalledTimes(2)
  })

  test('taken back after an expiry only if nothing was saved since (24i)', async () => {
    const config = createConfig(freeRow)

    await expect(
      createEditHoldHandlers(config).take(request, {
        expectedUpdatedAt: new Date('2026-10-15T11:00:00.000Z'),
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'changed' })
    expect(config.writeHold).not.toHaveBeenCalled()
  })

  test('a published article or a submitted one of one’s own is not held', async () => {
    const published = createConfig({ ...freeRow, state: 'published' })
    await expect(
      createEditHoldHandlers(published).take(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).rejects.toMatchObject({ init: { status: 403 } })

    const submitted = createConfig({ ...freeRow, submittedAt: updatedAt })
    await expect(
      createEditHoldHandlers(submitted).take(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).rejects.toMatchObject({ init: { status: 403 } })
  })
})

describe('createEditHoldHandlers — renew', () => {
  test('extends the tab’s hold, quietly', async () => {
    const config = createConfig(heldBy('anna', 'tab-1', 'Anna'))

    await expect(
      createEditHoldHandlers(config).renew(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'holding' })
    expect(config.writeHold.mock.lastCall?.[1]).toMatchObject({
      holder: { authorId: 'anna', tabId: 'tab-1' },
      updatedAt,
    })
    expect(config.writeHold.mock.lastCall?.[2]).toMatchObject({ updatedAt })
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('an expired hold nobody took still belongs to its tab', async () => {
    const config = createConfig({
      ...heldBy('anna', 'tab-1', 'Anna'),
      heldUntil: minutesFromNow(-3),
    })

    await expect(
      createEditHoldHandlers(config).renew(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'holding' })
  })

  test('taken over: lost, naming who holds it now', async () => {
    const config = createConfig(heldBy('marie', 'tab-9', 'Marie Horáková'))

    await expect(
      createEditHoldHandlers(config).renew(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toMatchObject({
      holder: { name: 'Marie Horáková' },
      status: 'lost',
    })
    expect(config.writeHold).not.toHaveBeenCalled()
  })

  test('released or expired and free: lost without a holder', async () => {
    const config = createConfig(freeRow)

    await expect(
      createEditHoldHandlers(config).renew(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ holder: null, status: 'lost' })
  })
})

describe('createEditHoldHandlers — take over (24g)', () => {
  test('the Coordinator takes someone else’s hold, logged and announced', async () => {
    signInAs('marie', COORDINATOR)
    const config = createConfig(heldBy('jakub', 'tab-9', 'Jakub Novák'))

    await expect(
      createEditHoldHandlers(config).takeOver(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'holding' })
    expect(config.writeHold.mock.lastCall?.[2]).toMatchObject({
      heldByAuthorId: 'marie',
      heldByTabId: 'tab-1',
      updatedAt,
    })
    expect(mocks.recordContentLog).toHaveBeenCalledWith(
      { entity: 'article', entityId: 'a1', events: ['take_over'] },
      expect.anything(),
    )
    expect(mocks.publishContentEvent).toHaveBeenCalledOnce()
  })

  test('a Contributor may not take someone else’s hold', async () => {
    const config = createConfig(heldBy('jakub', 'tab-9', 'Jakub Novák'))

    await expect(
      createEditHoldHandlers(config).takeOver(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).rejects.toMatchObject({ init: { status: 403 } })
    expect(config.writeHold).not.toHaveBeenCalled()
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('anyone takes their own hold from another tab, unlogged', async () => {
    const config = createConfig(heldBy('anna', 'tab-2', 'Anna'))

    await expect(
      createEditHoldHandlers(config).takeOver(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'holding' })
    expect(mocks.recordContentLog).not.toHaveBeenCalled()
    // The other tab hears it and turns read-only.
    expect(mocks.publishContentEvent).toHaveBeenCalledOnce()
  })
})

describe('createEditHoldHandlers — release', () => {
  test('clears the tab’s hold, keeping updatedAt, and announces it', async () => {
    const config = createConfig(heldBy('anna', 'tab-1', 'Anna'))

    await expect(
      createEditHoldHandlers(config).release(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'released' })
    expect(config.writeHold.mock.lastCall?.[2]).toEqual({
      heldByAuthorId: null,
      heldByTabId: null,
      heldSince: null,
      heldUntil: null,
      updatedAt,
    })
    expect(mocks.publishContentEvent).toHaveBeenCalledOnce()
  })

  test('another tab’s hold stays', async () => {
    const config = createConfig(heldBy('anna', 'tab-2', 'Anna'))

    await createEditHoldHandlers(config).release(request, {
      id: 'a1',
      tabId: 'tab-1',
    })

    expect(config.writeHold).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })

  test('an empty draft goes with its hold, unannounced (0020)', async () => {
    const config = createConfig({
      ...heldBy('anna', 'tab-1', 'Anna'),
      isEmpty: true,
    })

    await createEditHoldHandlers(config).release(request, {
      id: 'a1',
      tabId: 'tab-1',
    })

    expect(config.deleteEmpty).toHaveBeenCalledWith('a1', {
      authorId: 'anna',
      tabId: 'tab-1',
    })
    expect(config.writeHold).not.toHaveBeenCalled()
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})

describe('createEditHoldHandlers — review fixes', () => {
  test('a takeover repeats the holder it read, so a hold taken in between fails it', async () => {
    signInAs('marie', COORDINATOR)
    const config = createConfig(heldBy('jakub', 'tab-9', 'Jakub Novák'))

    await createEditHoldHandlers(config).takeOver(request, {
      id: 'a1',
      tabId: 'tab-1',
    })

    expect(config.writeHold.mock.lastCall?.[1]).toMatchObject({
      holder: { authorId: 'jakub', tabId: 'tab-9' },
    })
  })

  test('a takeover over text saved since the editor loaded: changed, nothing written', async () => {
    signInAs('marie', COORDINATOR)
    const config = createConfig(heldBy('jakub', 'tab-9', 'Jakub Novák'))

    await expect(
      createEditHoldHandlers(config).takeOver(request, {
        expectedUpdatedAt: new Date('2026-10-15T11:00:00.000Z'),
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'changed' })
    expect(config.writeHold).not.toHaveBeenCalled()
  })

  test('taking over an empty draft logs nothing (0020)', async () => {
    signInAs('marie', COORDINATOR)
    const config = createConfig({
      ...heldBy('jakub', 'tab-9', 'Jakub Novák'),
      isEmpty: true,
    })

    await createEditHoldHandlers(config).takeOver(request, {
      id: 'a1',
      tabId: 'tab-1',
    })

    expect(mocks.recordContentLog).not.toHaveBeenCalled()
  })

  test('a renewal after one’s own submission: changed, the editor stops (07d)', async () => {
    const config = createConfig({
      ...heldBy('anna', 'tab-1', 'Anna'),
      submittedAt: updatedAt,
    })

    await expect(
      createEditHoldHandlers(config).renew(request, {
        id: 'a1',
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'changed' })
    expect(config.writeHold).not.toHaveBeenCalled()
  })
})

describe('createEditHoldHandlers — a page going away from an empty draft', () => {
  test('ends its hold by expiring it and keeps the draft for a reload', async () => {
    const row = { ...heldBy('anna', 'tab-1', 'Anna'), isEmpty: true }
    const config = createConfig(row)

    await expect(
      createEditHoldHandlers(config).release(request, {
        id: 'a1',
        keepEmpty: true,
        tabId: 'tab-1',
      }),
    ).resolves.toEqual({ status: 'released' })
    expect(config.deleteEmpty).not.toHaveBeenCalled()

    const data = config.writeHold.mock.lastCall?.[2]
    expect(data).toMatchObject({
      heldByAuthorId: 'anna',
      heldByTabId: 'tab-1',
      updatedAt,
    })
    expect(data.heldUntil.getTime()).toBeLessThanOrEqual(Date.now())
    expect(mocks.publishContentEvent).not.toHaveBeenCalled()
  })
})
