import { Link, Outlet, useLoaderData } from "@remix-run/react"

import { Headline } from "app/components/headline"
import { Divider } from "~/components/divider"
import { Page } from "~/components/page"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  const canReadArchivedIssue = loaderData.session.user.role.permissions.some(
    (permission) =>
      permission.entity === "archived_issue" &&
      permission.action === "read" &&
      (permission.access === "own" || permission.access === "any")
  )

  const canReadEditorialBoard = loaderData.session.user.role.permissions.some(
    (permission) =>
      (permission.entity === "editorial_board_member" ||
        permission.entity === "editorial_board_member_position") &&
      permission.action === "read" &&
      (permission.access === "own" || permission.access === "any")
  )

  const canReadPodcast = loaderData.session.user.role.permissions.some(
    (permission) =>
      permission.entity === "podcast" &&
      permission.action === "read" &&
      (permission.access === "own" || permission.access === "any")
  )

  const canReadUser = loaderData.session.user.role.permissions.some(
    (permission) =>
      permission.entity === "user" &&
      permission.action === "read" &&
      (permission.access === "own" || permission.access === "any")
  )

  console.log({
    canReadUser,
    permissions: loaderData.session.user.role.permissions,
  })

  return (
    <Page>
      <Headline>Administrace</Headline>
      {canReadArchivedIssue && (
        <Link to={"/administration/archive"} preventScrollReset={true}>
          Archiv
        </Link>
      )}
      {canReadPodcast && (
        <Link to={"/administration/podcasts"} preventScrollReset={true}>
          Podcasty
        </Link>
      )}
      {canReadEditorialBoard && (
        <Link to={"/administration/editorial-board"} preventScrollReset={true}>
          Redakce
        </Link>
      )}
      {canReadUser && (
        <Link to={"/administration/users"} preventScrollReset={true}>
          Uživatelé
        </Link>
      )}
      <Link to={"/administration/settings"} preventScrollReset={true}>
        Nastavení
      </Link>
      <Divider variant={"secondary"} />
      <Outlet />
    </Page>
  )
}

export { loader } from "./_loader"
export { meta } from "./_meta"
