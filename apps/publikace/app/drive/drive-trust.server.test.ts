import * as assert from 'remix/assert'
import { describe, it } from 'remix/test'

import { createDriveTrust } from './drive-trust.server.ts'
import type { FolderStanding } from './folders.server.ts'

const START = Temporal.Instant.from('2026-11-28T09:00:00Z')
const MARKED = Temporal.Instant.from('2026-11-27T15:20:00Z')

/** Folders whose answer the test sets, counting what reached them. */
function answering(): {
  asked: string[]
  folders: { standing(id: string): Promise<FolderStanding> }
  standing: FolderStanding
} {
  let fake = {
    asked: [] as string[],
    folders: {
      standing: async (id: string) => {
        fake.asked.push(id)
        return fake.standing
      },
    },
    standing: 'exists' as FolderStanding,
  }
  return fake
}

describe('the trust in what Drive said a moment ago', () => {
  it('answers for a folder found standing until five minutes have passed', async () => {
    let clock = { at: START }
    let trust = createDriveTrust({ now: () => clock.at })
    let drive = answering()
    let trusting = trust.trusting(drive.folders)

    assert.equal(await trusting.standing('folder-a'), 'exists')
    clock.at = START.add({ minutes: 4, seconds: 59 })
    assert.equal(await trusting.standing('folder-a'), 'exists')
    assert.deepEqual(drive.asked, ['folder-a'])

    clock.at = START.add({ minutes: 5 })
    assert.equal(await trusting.standing('folder-a'), 'exists')
    assert.deepEqual(drive.asked, ['folder-a', 'folder-a'])
  })

  it('never answers for a folder found missing, and forgets one found standing once it is not', async () => {
    let trust = createDriveTrust({ now: () => START })
    let drive = answering()
    let trusting = trust.trusting(drive.folders)

    await trusting.standing('folder-a')
    drive.standing = 'gone'
    await trust.recording(drive.folders).standing('folder-a')
    assert.equal(await trusting.standing('folder-a'), 'gone')
    drive.standing = 'in-binned-parent'
    assert.equal(await trusting.standing('folder-a'), 'in-binned-parent')
    assert.equal(await trusting.standing('folder-a'), 'in-binned-parent')
    assert.deepEqual(drive.asked, ['folder-a', 'folder-a', 'folder-a', 'folder-a', 'folder-a'])
  })

  it('keeps what it knew when Drive does not answer', async () => {
    let trust = createDriveTrust({ now: () => START })
    let drive = answering()
    let recording = trust.recording(drive.folders)

    await recording.standing('folder-a')
    drive.standing = 'unavailable'
    assert.equal(await recording.standing('folder-a'), 'unavailable')
    assert.equal(await trust.trusting(drive.folders).standing('folder-a'), 'exists')
    assert.deepEqual(drive.asked, ['folder-a', 'folder-a'])
  })

  it('asks Drive every time it records, and trusts no folder it never found standing', async () => {
    let trust = createDriveTrust({ now: () => START })
    let drive = answering()
    let recording = trust.recording(drive.folders)

    await recording.standing('folder-a')
    await recording.standing('folder-a')
    drive.standing = 'unavailable'
    assert.equal(await trust.trusting(drive.folders).standing('folder-b'), 'unavailable')
    assert.deepEqual(drive.asked, ['folder-a', 'folder-a', 'folder-b'])
  })

  it('forgets every folder and every Doc', async () => {
    let trust = createDriveTrust({ now: () => START })
    let drive = answering()
    let trusting = trust.trusting(drive.folders)

    await trusting.standing('folder-a')
    trust.askedDoc('article-1', MARKED)
    trust.forget()
    await trusting.standing('folder-a')
    assert.deepEqual(drive.asked, ['folder-a', 'folder-a'])
    assert.equal(trust.isDocFresh('article-1', MARKED), false)
  })

  it('holds a Doc asked about for five minutes, per final version', () => {
    let clock = { at: START }
    let trust = createDriveTrust({ now: () => clock.at })

    assert.equal(trust.isDocFresh('article-1', MARKED), false)
    trust.askedDoc('article-1', MARKED)
    assert.equal(trust.isDocFresh('article-1', MARKED), true)
    assert.equal(trust.isDocFresh('article-1', MARKED.add({ hours: 1 })), false)
    assert.equal(trust.isDocFresh('article-2', MARKED), false)

    clock.at = START.add({ minutes: 5 })
    assert.equal(trust.isDocFresh('article-1', MARKED), false)
  })
})
