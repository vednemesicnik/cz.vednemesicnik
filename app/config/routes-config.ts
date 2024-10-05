export const routesConfig = {
  administration: {
    archive: {
      index: {
        staticPath: "/administration/archive",
      },
      addArchivedIssue: {
        staticPath: "/administration/archive/add-archived-issue",
      },
      editArchivedIssue: {
        dynamicPath: "/administration/archive/edit-archived-issue/:id",
        getStaticPath: (id: string) =>
          `/administration/archive/edit-archived-issue/${id}` as const,
      },
      deleteArchivedIssue: {
        dynamicPath: "/administration/archive/delete-archived-issue/:id",
        getStaticPath: (id: string) =>
          `/administration/archive/delete-archived-issue/${id}` as const,
      },
    },
  },
} as const
