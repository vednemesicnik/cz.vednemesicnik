export const routesConfig = {
  administration: {
    archive: {
      addArchivedIssue: {
        getPath: () => '/administration/archive/add-issue' as const,
        route: '/administration/archive/add-issue',
      },
      editArchivedIssue: {
        getPath: (id: string) =>
          `/administration/archive/edit-issue/${id}` as const,
        route: '/administration/archive/edit-issue/:id',
      },
      index: {
        getPath: () => '/administration/archive' as const,
        route: '/administration/archive',
      },
    },
  },
} as const
