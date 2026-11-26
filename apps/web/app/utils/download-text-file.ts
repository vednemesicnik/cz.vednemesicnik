// Client-side text file download via an object URL. Suited to one-time secrets
// (e.g. backup codes) that live only in the current page and must not be
// re-fetched from the server.
export const downloadTextFile = (fileName: string, contents: string) => {
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.download = fileName
  anchor.href = url
  anchor.click()

  // Defer revocation so the browser starts the download before the object URL
  // is released; revoking synchronously can cancel it in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
