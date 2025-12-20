type Status = 'error' | undefined

export const getStatusCodeFromSubmissionStatus = (status: Status) => {
  if (status === 'error') {
    return 400
  } else {
    return 200
  }
}
