import * as serverSharp from 'sharp'

// Sharp runs only on the write path (upload/variant generation); the read path
// streams pre-generated files with no image processing.
export const sharp = serverSharp.default
