import { Link, Outlet, useLoaderData } from "@remix-run/react"

import { Headline } from "app/components/headline"
import { Divider } from "~/components/divider"
import { Page } from "~/components/page"
import { getRights } from "~/utils/permissions"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  const [
    canReadArchivedIssues,
    canReadEditorialBoardMembers,
    canReadEditorialBoardMemberPositions,
    canReadPodcasts,
    canReadUsers,
  ] = getRights(loaderData.session.user.role.permissions, {
    entities: [
      "archived_issue",
      "editorial_board_member",
      "editorial_board_member_position",
      "podcast",
      "user",
    ],
    actions: ["read"],
    access: ["any", "own"],
  })

  return (
    <Page>
      <Headline>Administrace</Headline>
      {canReadArchivedIssues && (
        <Link to={"/administration/archive"} preventScrollReset={true}>
          Archiv
        </Link>
      )}
      {canReadPodcasts && (
        <Link to={"/administration/podcasts"} preventScrollReset={true}>
          Podcasty
        </Link>
      )}
      {canReadEditorialBoardMembers && canReadEditorialBoardMemberPositions && (
        <Link to={"/administration/editorial-board"} preventScrollReset={true}>
          Redakce
        </Link>
      )}
      {canReadUsers && (
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
