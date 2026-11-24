import { EVIDENCE_PROPERTY } from '../domain/record.ts'
import { ATTEMPT_PROPERTY } from './article-files.server.ts'
import type { IssueFiles } from './issue-files.server.ts'

/**
 * Putting into the shared drive's bin a folder the app made, with everything in it, when the
 * editors-in-chief remove what should not exist (#151, `12w`; the articles' and groups' removals
 * use it too). The app never touches what a person made or moved (`11c`): a folder holding a file
 * the app did not make, or one that is no longer where the app made it, stays where it is. Drive
 * bins a folder's contents with it, so the one call either happens or does not.
 */

export type ForeignChild = { folderName: string; id: string; isFolder: boolean; name: string }

export type BinOutcome =
  | { kind: 'already-binned' }
  | { kind: 'binned' }
  | { files: ForeignChild[]; kind: 'foreign' }
  | { kind: 'moved' }
  | { kind: 'unavailable' }

export type OwnFolder = {
  folderId: string
  /** What the folder's name is, for a Callout naming the files a person put into it. */
  folderName: string
  /** Where the app made it. */
  expectedParentId: string
  /** The IDs the app stored, beside the tags it puts on every file of an attempt. */
  ownIds: ReadonlySet<string>
}

function isOwn(
  file: { appProperties: Record<string, string>; id: string },
  ownIds: ReadonlySet<string>,
) {
  return (
    ownIds.has(file.id) ||
    file.appProperties[ATTEMPT_PROPERTY] !== undefined ||
    file.appProperties[EVIDENCE_PROPERTY] !== undefined
  )
}

/**
 * The files a person put into the folder or into a folder the app made inside it. A folder of
 * theirs counts as one file and is not walked: what is in it is theirs too.
 */
async function foreignIn(
  files: IssueFiles,
  folder: { id: string; name: string },
  ownIds: ReadonlySet<string>,
): Promise<ForeignChild[] | null> {
  let children = await files.listChildren(folder.id)
  if (children === null) return null
  let foreign: ForeignChild[] = []
  for (let child of children) {
    if (!isOwn(child, ownIds)) {
      foreign.push({
        folderName: folder.name,
        id: child.id,
        isFolder: child.isFolder,
        name: child.name,
      })
    } else if (child.isFolder) {
      let inner = await foreignIn(files, child, ownIds)
      if (inner === null) return null
      foreign.push(...inner)
    }
  }
  return foreign
}

export async function binOwnFolder(files: IssueFiles, folder: OwnFolder): Promise<BinOutcome> {
  let location = await files.locate(folder.folderId)
  if (location.kind === 'unavailable') return { kind: 'unavailable' }
  /* Already where the removal would put it, or gone for good: nothing left to move (`12w`). A
     folder moved off the shared drive answers as one gone for good, since the account no longer
     reaches it. */
  if (location.kind === 'binned' || location.kind === 'deleted') return { kind: 'already-binned' }
  if (!location.parents.includes(folder.expectedParentId)) return { kind: 'moved' }

  let foreign = await foreignIn(
    files,
    { id: folder.folderId, name: folder.folderName },
    folder.ownIds,
  )
  if (foreign === null) return { kind: 'unavailable' }
  if (foreign.length > 0) return { files: foreign, kind: 'foreign' }

  return (await files.trash(folder.folderId)) ? { kind: 'binned' } : { kind: 'unavailable' }
}
