export const appendParameters = (route: string, parameters: string) =>
  [route, parameters].filter(Boolean).join("?")
