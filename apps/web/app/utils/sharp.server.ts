import * as serverSharp from 'sharp'

// Sharp runs only on the write path (upload/variant generation); the read path
// streams pre-generated files with no image processing.
export const sharp = serverSharp.default

// One libvips thread per image. Sharp picks it alone on glibc, but not once
// MALLOC_ARENA_MAX is set (docker/fly/Dockerfile); each thread adds to the
// peak on the 1 GB VM.
sharp.concurrency(1)
