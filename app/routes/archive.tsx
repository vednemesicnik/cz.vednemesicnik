// noinspection JSUnusedGlobalSymbols,TypeScriptValidateJSTypes

import { json, type LinksFunction, type LoaderFunctionArgs, type MetaFunction, redirect } from "@remix-run/node"
import { useLoaderData, useRouteError, useSearchParams } from "@remix-run/react"

import { ArchivedIssue } from "~/components/archived-issue"
import { ArchivedIssuesList } from "~/components/archived-issues-list"
import { ArchivedIssuesListItem } from "~/components/archived-issues-list-item"
import { LIMIT_PARAM, LoadMoreContent } from "~/components/load-more-content"
import { Page } from "~/components/page"
import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"
import { getArchivedIssueCoverSrc } from "~/utils/get-archived-issue-cover-src"
import { getArchivedIssuePdfSrc } from "~/utils/get-archived-issue-pdf-src"
import { preloadFonts } from "~/utils/preload-fonts"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Archiv" }, { name: "description", content: "Archiv čísel Vedneměsíčníku" }]
}

export const links: LinksFunction = () => [...preloadFonts("regular", "medium", "semiBold", "bold")]

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const limit = url.searchParams.get(LIMIT_PARAM)

  if (!limit) {
    url.searchParams.set(LIMIT_PARAM, "20")
    throw redirect(url.toString(), { status: 301 })
  }

  const { isAuthorized } = await getAuthorization(request)

  const archivedIssues = await prisma.archivedIssue.findMany({
    ...(isAuthorized ? {} : { where: { published: true } }),
    orderBy: {
      publishedAt: "desc",
    },
    take: Number(limit),
    select: {
      id: true,
      label: true,
      published: true,
      cover: {
        select: {
          id: true,
          altText: true,
        },
      },
      pdf: {
        select: {
          id: true,
        },
      },
    },
  })

  // throw new Error("Loader error: Archive loader is not implemented yet.")

  return json({ archivedIssues, isAuthorized })
}

export default function Archive() {
  const data = useLoaderData<typeof loader>()
  const { isAuthorized, archivedIssues } = data

  const [searchParams] = useSearchParams()
  const limit = Number(searchParams.get(LIMIT_PARAM))

  // throw new Error("Component error: Archive component is not implemented yet.")

  return (
    <Page>
      <ArchivedIssuesList>
        {archivedIssues.map((issue) => {
          const { id, cover, pdf, label, published } = issue

          const isVisible = published || (isAuthorized && !published)

          if (cover === null || pdf === null || !isVisible) return null

          const coverAlt = cover.altText
          const coverSrc = getArchivedIssueCoverSrc(cover.id)
          const pdfSrc = getArchivedIssuePdfSrc(pdf.id)
          const isGhosted = !published && isAuthorized

          return (
            <ArchivedIssuesListItem key={id}>
              <ArchivedIssue
                coverAlt={coverAlt}
                coverSrc={coverSrc}
                pdfSrc={pdfSrc}
                label={label}
                isGhosted={isGhosted}
              />
            </ArchivedIssuesListItem>
          )
        })}
      </ArchivedIssuesList>
      {archivedIssues.length < limit ? null : <LoadMoreContent limit={limit + 20} action={"/archive"} />}
    </Page>
  )
}

export const ErrorBoundary = () => {
  const error = useRouteError()
  console.error(error)

  return (
    <Page>
      <h1>Archiv</h1>
      <p>Došlo k chybě při načítání archivu.</p>
    </Page>
  )
}
