import { PassThrough } from 'node:stream'

import type { FormatEnum, Sharp } from 'sharp'
import { z } from 'zod'

import {
  FORMAT_SEARCH_PARAM,
  HEIGHT_SEARCH_PARAM,
  QUALITY_SEARCH_PARAM,
  WIDTH_SEARCH_PARAM,
} from '~/utils/create-image-source-route'

const validFormats = ['avif', 'webp', 'jpeg'] satisfies Array<keyof FormatEnum>

const imageParamsSchema = z.object({
  format: z.enum(validFormats as [string, ...string[]]).nullable(),
  height: z.number().nullable(),
  quality: z.number().min(1).max(100).nullable(),
  width: z.number().nullable(),
})

export const getImageParams = (request: Request) => {
  const url = new URL(request.url)

  const width = url.searchParams.get(WIDTH_SEARCH_PARAM)
  const quality = url.searchParams.get(QUALITY_SEARCH_PARAM)
  const height = url.searchParams.get(HEIGHT_SEARCH_PARAM)
  const format = url.searchParams.get(FORMAT_SEARCH_PARAM)

  const result = imageParamsSchema.safeParse({
    format,
    height: height !== null ? Number(height) : null,
    quality: quality !== null ? Number(quality) : null,
    width: width !== null ? Number(width) : null,
  })

  if (!result.success) {
    throw new Error(
      `Invalid image parameters: ${result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ')}`,
    )
  }

  return {
    format: result.data.format as unknown as keyof FormatEnum | null,
    height: result.data.height,
    quality: result.data.quality,
    width: result.data.width,
  }
}

/**
 * Pumps data from a Sharp stream to a Web Streams API WritableStream
 */
function pumpSharpStreamToWebStream(
  sharpStream: Sharp,
  writable: WritableStream,
): void {
  // Set up the background process
  ;(async () => {
    try {
      // Get the node stream from sharp
      const nodeStream = sharpStream.pipe(new PassThrough())
      const writer = writable.getWriter()

      // Manual pumping from node stream to web stream
      nodeStream.on('data', (chunk: Uint8Array) => {
        writer.write(chunk)
      })

      nodeStream.on('end', () => {
        writer.close()
      })

      nodeStream.on('error', (err: Error) => {
        writer.abort(err)
      })
    } catch (err) {
      console.error('Image processing error:', err)
      writable.abort(err instanceof Error ? err : new Error(String(err)))
    }
  })()
}

export const createImageResponse = (
  image: {
    stream: Sharp
    contentType: string
  },
  fileName: string,
  tag: string,
) => {
  // Create a web-standard TransformStream
  const { readable, writable } = new TransformStream()

  // Start pumping data in the background
  pumpSharpStreamToWebStream(image.stream, writable)

  // Return the response immediately
  return new Response(readable, {
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Type': image.contentType,
      ETag: tag,
    },
  })
}
