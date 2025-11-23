// noinspection JSUnusedGlobalSymbols

import { Link } from "react-router"

import { Headline } from "~/components/headline"
import { getAuthorRights } from "~/utils/get-author-rights"
import { getUserRights } from "~/utils/get-user-rights"

import type { Route } from "./+types/route"

export default function Route({ loaderData }: Route.ComponentProps) {
  const [
    // entity: user
    [
      // action: view
      [
        // access: own
        hasViewOwnUserRight,
        // access: any
        hasViewAnyUserRight,
      ],
    ],
    // entity: author
    [
      // action: view
      [
        // access: own
        hasViewOwnAuthorRight,
        // access: any
        hasViewAnyAuthorRight,
      ],
    ],
  ] = getUserRights(loaderData.session.user.role.permissions, {
    entities: ["user", "author"],
    actions: ["view"],
    access: ["own", "any"],
  })

  const canViewUsers = hasViewOwnUserRight || hasViewAnyUserRight
  const canViewAuthors = hasViewAnyAuthorRight || hasViewOwnAuthorRight

  const [
    // entity: article
    [
      // action: view
      [
        // access: own
        [hasViewOwnArticleRight],
        // access: any
        [hasViewAnyArticleRight],
      ],
    ],
    // entity: article_category
    [
      // action: view
      [
        // access: own
        [hasViewOwnArticleCategoryRight],
        // access: any
        [hasViewAnyArticleCategoryRight],
      ],
    ],
    // entity: article_tag
    [
      // action: view
      [
        // access: own
        [hasViewOwnArticleTagRight],
        // access: any
        [hasViewAnyArticleTagRight],
      ],
    ],
    // entity: podcast
    [
      // action: view
      [
        // access: own
        [hasViewOwnPodcastRight],
        // access: any
        [hasViewAnyPodcastRight],
      ],
    ],
    // entity: issue
    [
      // action: view
      [
        // access: own
        [hasViewOwnIssueRight],
        // access: any
        [hasViewAnyIssueRight],
      ],
    ],
    // entity: editorial_board_position
    [
      // action: view
      [
        // access: own
        [hasViewOwnEditorialBoardPositionRight],
        // access: any
        [hasViewAnyEditorialBoardPositionRight],
      ],
    ],
    // entity: editorial_board_member
    [
      // action: view
      [
        // access: own
        [hasViewOwnEditorialBoardMemberRight],
        // access: any
        [hasViewAnyEditorialBoardMemberRight],
      ],
    ],
  ] = getAuthorRights(loaderData.session.user.author.role.permissions, {
    entities: [
      "article",
      "article_category",
      "article_tag",
      "podcast",
      "issue",
      "editorial_board_position",
      "editorial_board_member",
    ],
    actions: ["view"],
    access: ["own", "any"],
  })

  const canViewArticles = hasViewOwnArticleRight || hasViewAnyArticleRight
  const canViewArticleCategories =
    hasViewOwnArticleCategoryRight || hasViewAnyArticleCategoryRight
  const canViewArticleTags =
    hasViewOwnArticleTagRight || hasViewAnyArticleTagRight
  const canViewPodcasts = hasViewOwnPodcastRight || hasViewAnyPodcastRight
  const canViewIssues = hasViewOwnIssueRight || hasViewAnyIssueRight
  const canViewEditorialBoardPositions =
    hasViewOwnEditorialBoardPositionRight ||
    hasViewAnyEditorialBoardPositionRight
  const canViewEditorialBoardMembers =
    hasViewOwnEditorialBoardMemberRight || hasViewAnyEditorialBoardMemberRight

  return (
    <>
      <Headline>Administrace</Headline>

      {canViewUsers && <Link to={"/administration/users"}>Uživatelé</Link>}
      {canViewAuthors && <Link to={"/administration/authors"}>Autoři</Link>}
      {canViewArticles && <Link to={"/administration/articles"}>Články</Link>}
      {canViewArticleCategories && (
        <Link to={"/administration/article-categories"}>Kategorie článků</Link>
      )}
      {canViewArticleTags && (
        <Link to={"/administration/article-tags"}>Štítky článků</Link>
      )}
      {canViewPodcasts && <Link to={"/administration/podcasts"}>Podcasty</Link>}
      {canViewIssues && <Link to={"/administration/archive"}>Archiv</Link>}
      {(canViewEditorialBoardPositions || canViewEditorialBoardMembers) && (
        <Link to={"/administration/editorial-board"}>Redakce</Link>
      )}
      <Link to={"/administration/settings"}>Nastavení</Link>
    </>
  )
}

export { loader } from "./_loader"
export { meta } from "./_meta"
