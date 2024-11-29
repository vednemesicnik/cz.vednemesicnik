export const routesConfig = {
  administration: {
    archive: {
      index: {
        staticPath: "/administration/archive",
      },
      addArchivedIssue: {
        staticPath: "/administration/archive/add-issue",
      },
      editArchivedIssue: {
        dynamicPath: "/administration/archive/edit-issue/:id",
        getStaticPath: (id: string) =>
          `/administration/archive/edit-issue/${id}` as const,
      },
    },
  },
} as const
