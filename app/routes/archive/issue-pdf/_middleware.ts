import type { Prisma } from '@generated/prisma/client'

import { checkCacheValidation } from '~/utils/cache.server'
import { prisma } from '~/utils/db.server'
import { getContentHash } from '~/utils/hash.server'
import { parseIssuePdfFileName } from '~/utils/issue/parse-issue-pdf-file-name'
import { buildPdfKey } from '~/utils/pdf-store/pdf-key'
import { pdfStore } from '~/utils/pdf-store/pdf-store.server'
import {
  buildPdfResponse,
  PDF_CACHE_CONTROL,
} from '~/utils/pdf-store/serve-pdf.server'
import {
  getWebContentVisibility,
  ownByAuthor,
} from '~/utils/permissions/author/get-web-content-visibility.server'

import type { Route } from './+types/route'

const pdfSelect = { contentType: true, id: true, updatedAt: true } as const

/**
 * A draft's PDF at its provisional address (26j, log 0039): it has no name
 * until publish, so a previewer finds it by the number the name stands for.
 */
const findDraftPdf = (fileName: string, draftWhere: Prisma.IssueWhereInput) => {
  const number = parseIssuePdfFileName(fileName)
  if (number === null) return null

  return prisma.issuePDF.findFirst({
    orderBy: { issue: { updatedAt: 'desc' } },
    select: pdfSelect,
    where: { issue: { AND: [draftWhere, { ...number, state: 'draft' }] } },
  })
}

/**
 * Serves the issue PDF without calling `next()`. A missing PDF calls `next()` instead,
 * so the route loader throws the 404 and the website layout boundary renders it
 * (design 30f). Thrown here, it would skip the loaders and reach the root boundary.
 *
 * @returns The PDF, a 304 when the client's copy is current, or the 404 page.
 */
const serveIssuePdf: Route.MiddlewareFunction = async (
  { request, params },
  next,
) => {
  const { fileName } = params

  const visibility = await getWebContentVisibility(request, ['issue'])
  // Only a published number is unique (log 0039): a preview link names the
  // issue among drafts that share it, or whose number another one holds.
  const id = new URL(request.url).searchParams.get('id')
  const idWhere = id === null ? {} : { id }

  // `id` builds the object-store key, `updatedAt` drives cache validation, and
  // `contentType` sets the response header — the PDF bytes live in the object store.
  // Only the PDF of an issue the web may show: published, or previewed by
  // rights, a draft by its provisional address too.
  const pdf =
    (await prisma.issuePDF.findUnique({
      select: pdfSelect,
      where: {
        fileName,
        issue: {
          ...visibility.where('issue', ownByAuthor, ['draft', 'archived']),
          ...idWhere,
        },
      },
    })) ??
    (await findDraftPdf(fileName, {
      ...visibility.where('issue', ownByAuthor),
      ...idWhere,
    }))

  if (pdf === null) return next()

  // ETag from fileName + updatedAt timestamp (invalidates when the PDF changes)
  const etag = getContentHash(`${fileName}:${pdf.updatedAt.valueOf()}`)
  const lastModified = pdf.updatedAt.toUTCString()

  // Check if client has cached version (supports both ETag and Last-Modified)
  const cachedResponse = checkCacheValidation(
    request,
    etag,
    lastModified,
    PDF_CACHE_CONTROL,
  )
  if (cachedResponse !== null) return cachedResponse

  const meta = { contentType: pdf.contentType, etag, fileName, lastModified }

  const stream = await pdfStore.getStream(buildPdfKey(pdf.id))
  if (stream === null) return next()

  return buildPdfResponse(stream, meta)
}

export const middleware: Route.MiddlewareFunction[] = [serveIssuePdf]
