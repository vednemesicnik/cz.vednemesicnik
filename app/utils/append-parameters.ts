export const appendParameters = (route: string, searchParams: string) =>
  [route, searchParams].filter(Boolean).join("?")
