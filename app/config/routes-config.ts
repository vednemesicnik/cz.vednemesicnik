export const routesConfig = {
  administration: {
    archive: {
      index: {
        route: "/administration/archive",
        getPath: () => "/administration/archive" as const,
      },
      addArchivedIssue: {
        route: "/administration/archive/add-issue",
        getPath: () => "/administration/archive/add-issue" as const,
      },
      editArchivedIssue: {
        route: "/administration/archive/edit-issue/:id",
        getPath: (id: string) =>
          `/administration/archive/edit-issue/${id}` as const,
      },
    },
  },
} as const
