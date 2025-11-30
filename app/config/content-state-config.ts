import { type ContentState } from "@generated/prisma/enums"

type ContentStateConfig = {
  map: Record<ContentState, ContentState>
  selectMap: Record<ContentState, string>
  states: ContentState[]
}

export const contentStateConfig: ContentStateConfig = {
  map: {
    draft: "draft",
    published: "published",
    archived: "archived",
  },
  selectMap: {
    draft: "Rozpracováno",
    published: "Publikováno",
    archived: "Archivováno",
  },
  states: ["draft", "published", "archived"],
}
