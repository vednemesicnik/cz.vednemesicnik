import { Link, Outlet, useLoaderData } from "@remix-run/react"

import { Headline } from "app/components/headline"
import { Divider } from "~/components/divider"
import { Page } from "~/components/page"
import { getRights } from "~/utils/permissions"

import { type loader } from "./_loader"

export default function Route() {
  const loaderData = useLoaderData<typeof loader>()

  const [[canViewUsers], [canViewAuthors]] = getRights(
    loaderData.session.user.role.permissions,
    {
      entities: ["user", "author"],
      access: ["any", "own"],
    }
  )

  const [
    [canViewArticles],
    [canViewArticleCategories],
    [canViewPodcasts],
    [canViewArchivedIssues],
    [canViewEditorialBoardPositions],
    [canViewEditorialBoardMembers],
  ] = getRights(loaderData.session.user.author.role.permissions, {
    entities: [
      "article",
      "article_category",
      "podcast",
      "archived_issue",
      "editorial_board_position",
      "editorial_board_member",
    ],
    access: ["any", "own"],
  })

  return (
    <Page>
      <Headline>Administrace</Headline>
      {canViewUsers && (
        <Link to={"/administration/users"} preventScrollReset={true}>
          Uživatelé
        </Link>
      )}
      {canViewAuthors && (
        <Link to={"/administration/authors"} preventScrollReset={true}>
          Autoři
        </Link>
      )}
      {canViewArticles && (
        <Link to={"/administration/articles"} preventScrollReset={true}>
          Články
        </Link>
      )}
      {canViewArticleCategories && (
        <Link
          to={"/administration/article-categories"}
          preventScrollReset={true}
        >
          Kategorie článků
        </Link>
      )}
      {canViewPodcasts && (
        <Link to={"/administration/podcasts"} preventScrollReset={true}>
          Podcasty
        </Link>
      )}
      {canViewArchivedIssues && (
        <Link to={"/administration/archive"} preventScrollReset={true}>
          Archiv
        </Link>
      )}
      {(canViewEditorialBoardPositions || canViewEditorialBoardMembers) && (
        <Link to={"/administration/editorial-board"} preventScrollReset={true}>
          Redakce
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
