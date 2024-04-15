import { unstable_createMemoryUploadHandler, unstable_parseMultipartFormData } from "@remix-run/node"

export const getMultipartFormData = async (request: Request) => {
  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 1024 * 1024 * 8, // 8 MB
  })
  return await unstable_parseMultipartFormData(request, uploadHandler)
}
