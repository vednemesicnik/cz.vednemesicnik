import type { DriveFolders, FolderStanding } from './folders.server.ts'

/** How long an answer is trusted: a few minutes, so a batch of uploads asks Drive once. */
const TRUSTED_MINUTES = 5

type Standing = Pick<DriveFolders, 'standing'>

/**
 * What Drive said a moment ago, kept in the app's process for the checks that may lean on it
 * (#1122). Only a folder found standing is kept: one found missing is asked again
 * every time, so the warning of `21a` and `20a` goes as soon as it is back, and creating an
 * article or sending a batch always asks, so nothing goes into a folder that went meanwhile.
 * Every answer about a folder reaches it, wherever it was asked, so a folder found missing by a
 * send or the issue detail is not trusted by the next upload either.
 */
export type DriveTrust = {
  /** Drive's own answer every time, kept for the trusting checks. */
  recording<F extends Standing>(folders: F): F
  /** `exists` without asking while a check found the folder standing a few minutes ago. */
  trusting<F extends Standing>(folders: F): F
  /** Marks a final version's Doc as asked about now (`12q`). */
  askedDoc(articleId: string, markedAt: Temporal.Instant): void
  /** Whether the Doc of that final version was asked about a few minutes ago. */
  isDocFresh(articleId: string, markedAt: Temporal.Instant): boolean
  /** Forgets everything, so the next check asks Drive. */
  forget(): void
}

export function createDriveTrust(options: { now(): Temporal.Instant }): DriveTrust {
  let standingSince = new Map<string, Temporal.Instant>()
  let docAskedAt = new Map<string, Temporal.Instant>()

  let isFresh = (at: Temporal.Instant | undefined) =>
    at !== undefined &&
    Temporal.Instant.compare(options.now(), at.add({ minutes: TRUSTED_MINUTES })) < 0

  /* A Drive that does not answer says nothing about the folder, so it leaves what was known. */
  let keep = (folderId: string, standing: FolderStanding) => {
    if (standing === 'exists') standingSince.set(folderId, options.now())
    else if (standing !== 'unavailable') standingSince.delete(folderId)
  }

  let ask = async (folders: Standing, folderId: string) => {
    let standing = await folders.standing(folderId)
    keep(folderId, standing)
    return standing
  }

  let docKey = (articleId: string, markedAt: Temporal.Instant) =>
    `${articleId}@${markedAt.toString()}`

  return {
    recording: (folders) => ({ ...folders, standing: (folderId) => ask(folders, folderId) }),
    trusting: (folders) => ({
      ...folders,
      standing: (folderId) =>
        isFresh(standingSince.get(folderId)) ? Promise.resolve('exists') : ask(folders, folderId),
    }),
    askedDoc: (articleId, markedAt) => docAskedAt.set(docKey(articleId, markedAt), options.now()),
    isDocFresh: (articleId, markedAt) => isFresh(docAskedAt.get(docKey(articleId, markedAt))),
    forget: () => {
      standingSince.clear()
      docAskedAt.clear()
    },
  }
}
