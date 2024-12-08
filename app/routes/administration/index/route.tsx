// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { Headline } from "~/components/headline"
import { getRights } from "~/utils/permissions"

import type { Route } from "./+types/route"

export default function Route({ loaderData }: Route.ComponentProps) {
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
      "issue",
      "editorial_board_position",
      "editorial_board_member",
    ],
    access: ["any", "own"],
  })

  return (
    <>
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
    </>
  )
}

export { loader } from "./_loader"
export { meta } from "./_meta"
