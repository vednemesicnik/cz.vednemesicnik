export const getIssueData = (ordinalNumber: string, releasedAt: string) => {
  const releaseDate = new Date(releasedAt)
  // Derive both the label and the year in the editorial timezone so a release
  // backdated to local midnight can't shift the month (label) or the year
  // (pdfFileName) in a differently-zoned process.
  const year = releaseDate.toLocaleDateString('cs-CZ', {
    timeZone: 'Europe/Prague',
    year: 'numeric',
  })
  const monthYear = releaseDate.toLocaleDateString('cs-CZ', {
    month: 'long',
    timeZone: 'Europe/Prague',
    year: 'numeric',
  })

  const label = `${ordinalNumber}/${monthYear}`

  const coverAltText = `Obálka výtisku ${label}`
  const pdfFileName = `VDM-${year}-${ordinalNumber}.pdf`

  return {
    coverAltText,
    label,
    pdfFileName,
    releaseDate,
  }
}
