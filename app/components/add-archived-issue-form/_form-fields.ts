export const formFields = {
  ordinalNumber: {
    id: "ordinalNumber",
    name: "ordinalNumber",
  },
  publishedAt: {
    id: "publishedAt",
    name: "publishedAt",
  },
  cover: {
    id: "cover",
    name: "cover",
  },
  pdf: {
    id: "pdf",
    name: "pdf",
  },
  published: {
    name: "published",
    options: {
      published: {
        id: "published",
      },
      notPublished: {
        id: "notPublished",
      },
    },
  },
} as const
