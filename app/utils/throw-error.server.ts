export const throwError = (message: string) => {
  throw new Response(`Error: ${message}`, {
    status: 400,
  })
}
