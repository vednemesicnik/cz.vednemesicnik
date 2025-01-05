import { invariantResponse } from "@epic-web/invariant"

import { prisma } from "~/utils/db.server"
import { getAuthorForPermissionCheck } from "~/utils/get-author-for-permission-check.server"
import { getAuthorRights } from "~/utils/get-author-rights"
import { getIssueData } from "~/utils/get-issue-data"
import { getPublishDate } from "~/utils/get-publish-date"
import { convertImage } from "~/utils/sharp.server"
import { throwDbError } from "~/utils/throw-db-error.server"
import type {
  AuthorPermissionAction,
  AuthorPermissionEntity,
} from "~~/types/permission"

type Data = {
  ordinalNumber: string
  releasedAt: string
  state: string
  cover: File
  pdf: File
  authorId: string
}

export const createArchivedIssue = async (data: Data, sessionId: string) => {
  const { ordinalNumber, releasedAt, state, cover, pdf, authorId } = data

  const entities: AuthorPermissionEntity[] = ["issue"]
  const actions: AuthorPermissionAction[] = ["create", "publish"]

  const author = await getAuthorForPermissionCheck(sessionId, {
    actions,
    entities,
  })

  const [
    // entity: issue
    [
      // action: create
      [
        // access: own
        [hasCreateOwnIssueRight],
        // access: any
        [hasCreateAnyIssueRight],
      ],
    ],
  ] = getAuthorRights(author.permissions, {
    entities: ["issue"],
    actions: ["create"],
    access: ["any", "own"],
    states: [state],
    ownId: author.id,
    targetId: authorId,
  })

  /** User must have the right to create an issue */
  invariantResponse(
    hasCreateOwnIssueRight || hasCreateAnyIssueRight,
    "Unauthorized",
    {
      status: 401,
    }
  )

  const publishDate = getPublishDate(undefined, state)

  const { releaseDate, label, pdfFileName, coverAltText } = getIssueData(
    ordinalNumber,
    releasedAt
  )

  const convertedCover = await convertImage(cover, {
    width: "905",
    height: "1280",
    quality: "100",
    format: "jpeg",
  })

  try {
    await prisma.issue.create({
      data: {
        label: label,
        releasedAt: releaseDate,
        state: state,
        publishedAt: publishDate,
        cover: {
          create: {
            altText: coverAltText,
            contentType: convertedCover.contentType,
            blob: convertedCover.blob,
          },
        },
        pdf: {
          create: {
            fileName: pdfFileName,
            contentType: pdf.type,
            blob: await pdf.bytes(),
          },
        },
        authorId: authorId,
      },
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to add the archived issue.")
  }
}
