export const getIssueData = (ordinalNumber: string, releasedAt: string) => {
  const releaseDate = new Date(releasedAt)
  const year = releaseDate.getFullYear()
  const monthYear = releaseDate.toLocaleDateString('cs-CZ', {
    month: 'long',
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
