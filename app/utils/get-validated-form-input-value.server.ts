export const getValidatedFormInputValue = (
  formData: FormData,
  name: string
) => {
  const value = formData.get(name)

  if (value === null) {
    throw new Response(`Form input value for "${name}" is missing.`, {
      status: 400,
    })
  }

  const asString = (errorMessage?: string) => {
    if (typeof value !== "string") {
      throw new Response(
        errorMessage ??
          `The form input value for "${name}" is in an incorrect format.`,
        {
          status: 400,
        }
      )
    }

    return value
  }

  const asFile = (errorMessage?: string) => {
    if (!(value instanceof File)) {
      throw new Response(
        errorMessage ??
          `The form input value for "${name}" is in an incorrect format.`,
        {
          status: 400,
        }
      )
    }

    return value
  }

  return {
    asString,
    asFile,
  }
}
