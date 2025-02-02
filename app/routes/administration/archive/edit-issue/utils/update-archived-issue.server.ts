import { invariantResponse } from "@epic-web/invariant"
import { createId } from "@paralleldrive/cuid2"

import { contentStateConfig } from "~/config/content-state-config"
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
  id: string
  ordinalNumber: string
  releasedAt: string
  coverId: string
  cover?: File
  pdfId: string
  pdf?: File
  state: string
  publishedAt?: string
  authorId: string
}

export const updateArchivedIssue = async (data: Data, sessionId: string) => {
  const {
    id,
    ordinalNumber,
    releasedAt,
    state,
    publishedAt,
    coverId,
    cover,
    pdfId,
    pdf,
    authorId,
  } = data

  const entities: AuthorPermissionEntity[] = ["issue"]
  const actions: AuthorPermissionAction[] = [
    "update",
    "publish",
    "retract",
    "archive",
    "restore",
  ]

  const author = await getAuthorForPermissionCheck(sessionId, {
    actions,
    entities,
  })

  const issue = await prisma.issue.findUniqueOrThrow({
    where: { id },
    select: {
      state: true,
    },
  })

  const [
    // entity: issue
    [
      // action: update
      [
        // access: own
        [hasUpdateOwnIssueRight],
        // access: any
        [hasUpdateAnyIssueRight],
      ],
      // action: publish
      [
        // access: own
        [hasPublishOwnIssueRight],
        // access: any
        [hasPublishAnyIssueRight],
      ],
      // action: retract
      [
        // access: own
        [hasRetractOwnIssueRight],
        // access: any
        [hasRetractAnyIssueRight],
      ],
      // action: archive
      [
        // access: own
        [hasArchiveOwnIssueRight],
        // access: any
        [hasArchiveAnyIssueRight],
      ],
      // action: restore
      [
        // access: own
        [hasRestoreOwnIssueRight],
        // access: any
        [hasRestoreAnyIssueRight],
      ],
    ],
  ] = getAuthorRights(author.permissions, {
    entities: ["issue"],
    actions: ["update", "publish", "retract", "archive", "restore"],
    access: ["own", "any"],
    states: [issue.state],
    ownId: author.id,
    targetId: authorId,
  })

  const isUpdating = issue.state === state
  const isArchivingDraft =
    issue.state === contentStateConfig.map.draft &&
    state === contentStateConfig.map.archived
  const isPublishingArchived =
    issue.state === contentStateConfig.map.archived &&
    state === contentStateConfig.map.published
  const isPublishing =
    issue.state === contentStateConfig.map.draft &&
    state === contentStateConfig.map.published
  const isRetracting =
    issue.state === contentStateConfig.map.published &&
    state === contentStateConfig.map.draft
  const isArchiving =
    issue.state === contentStateConfig.map.published &&
    state === contentStateConfig.map.archived
  const isRestoring =
    issue.state === contentStateConfig.map.archived &&
    state === contentStateConfig.map.draft

  /** Draft issue can't be archived */
  invariantResponse(
    !isArchivingDraft,
    "Unauthorized to archive a draft issue",
    { status: 401 }
  )

  /** Archived issue can't be published */
  invariantResponse(
    !isPublishingArchived,
    "Unauthorized to publish an archived issue",
    { status: 401 }
  )

  /** If the issue is being updated, the user must have the right to update */
  if (isUpdating) {
    invariantResponse(
      hasUpdateOwnIssueRight || hasUpdateAnyIssueRight,
      "Unauthorized to update the issue",
      { status: 401 }
    )
  }

  /** If the issue is being published, the user must have the right to publish */
  if (isPublishing) {
    invariantResponse(
      hasPublishOwnIssueRight || hasPublishAnyIssueRight,
      "Unauthorized to publish the issue",
      { status: 401 }
    )
  }

  /** If the issue is being retracted, the user must have the right to retract */
  if (isRetracting) {
    console.log({ authorPermissions: author.permissions })
    console.log({ hasRetractOwnIssueRight, hasRetractAnyIssueRight })
    invariantResponse(
      hasRetractOwnIssueRight || hasRetractAnyIssueRight,
      "Unauthorized to retract the issue",
      { status: 401 }
    )
  }

  /** If the issue is being archived, the user must have the right to archive */
  if (isArchiving) {
    invariantResponse(
      hasArchiveOwnIssueRight || hasArchiveAnyIssueRight,
      "Unauthorized to archive the issue",
      { status: 401 }
    )
  }

  /** If the issue is being restored, the user must have the right to restore */
  if (isRestoring) {
    invariantResponse(
      hasRestoreOwnIssueRight || hasRestoreAnyIssueRight,
      "Unauthorized to restore the issue",
      { status: 401 }
    )
  }

  const { label, releaseDate, coverAltText, pdfFileName } = getIssueData(
    ordinalNumber,
    releasedAt
  )

  const publishDate = getPublishDate(publishedAt, state)

  const convertedCover = cover
    ? await convertImage(cover, {
        width: "905",
        height: "1280",
        quality: "80",
        format: "jpeg",
      })
    : undefined

  try {
    await prisma.issue.update({
      where: { id: id },
      data: {
        label: label,
        releasedAt: releaseDate,
        state: state,
        publishedAt: publishDate,
        cover: {
          update: {
            where: { id: coverId },
            data:
              convertedCover !== undefined
                ? {
                    id: createId(), // New ID forces browser to download new image
                    altText: coverAltText,
                    contentType: convertedCover.contentType,
                    blob: convertedCover.blob,
                  }
                : {
                    altText: coverAltText,
                  },
          },
        },
        pdf: {
          update: {
            where: { id: pdfId },
            data:
              pdf !== undefined
                ? {
                    id: createId(), // New ID forces browser to download new PDF
                    fileName: pdfFileName,
                    contentType: pdf.type,
                    blob: await pdf.bytes(),
                  }
                : {
                    fileName: pdfFileName,
                  },
          },
        },
        authorId: authorId,
      },
    })

    return { ok: true }
  } catch (error) {
    throwDbError(error, "Unable to update the archived issue.")
  }
}
