import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node"
import { redirect, json } from "@remix-run/node"
import { NavLink, Outlet } from "@remix-run/react"

import { Page } from "~/components/page"

import { getAuthorization } from "~/utils/auth.server"
import { prisma } from "~/utils/db.server"

export const meta: MetaFunction = () => {
  return [{ title: "Vedneměsíčník | Administrace - Archiv" }]
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { isAuthorized } = await getAuthorization(request)

  if (!isAuthorized) {
    throw redirect("/administration/sign-in")
  }

  const url = new URL(request.url)
  const limit = url.searchParams.get("limit")
  const order = url.searchParams.get("order")

  if (!limit || isNaN(Number(limit)) || !order || (order !== "desc" && order !== "asc")) {
    url.searchParams.set("limit", "20")
    url.searchParams.set("order", "desc")
    throw redirect(url.toString(), { status: 301 })
  }

  const archivedIssues = await prisma.archivedIssue.findMany({
    orderBy: {
      publishedAt: order,
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

  return json({ archivedIssues })
}

export default function AdministrationArchive() {
  return (
    <Page>
      <h1>Administrace Archivu</h1>
      <NavLink to={"/administration/archive/add-archived-issue"}>Přidat archivované číslo</NavLink>
      <Outlet />
    </Page>
  )
}
