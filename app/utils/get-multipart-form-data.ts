import { type FileUpload, parseFormData } from '@mjackson/form-data-parser'

const MAX_FILE_SIZE = 1024 * 1024 * 10 // 10 MB

type Options = {
  maxPartSize?: number
}

function createMemoryUploadHandler(options: Options) {
  const { maxPartSize = Infinity } = options

  return async (fileUpload: FileUpload) => {
    const reader = fileUpload.stream().getReader()
    const chunks: Uint8Array[] = []
    let size = 0

    while (size <= maxPartSize) {
      const { done, value } = await reader.read()

      if (done) {
        break
      }

      chunks.push(value)
      size += value.length
    }

    // TypeScript infers Uint8Array<ArrayBufferLike> which includes SharedArrayBuffer,
    // but BlobPart only accepts ArrayBuffer. In runtime, chunks are always Uint8Array
    // with regular ArrayBuffer, so this assertion is safe.
    return new File(chunks as BlobPart[], fileUpload.name, {
      type: fileUpload.type,
    })
  }
}

export const getMultipartFormData = async (request: Request) => {
  const uploadHandler = createMemoryUploadHandler({
    maxPartSize: MAX_FILE_SIZE,
  })

  return parseFormData(request, uploadHandler)
}
