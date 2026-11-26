#!/usr/bin/env tsx
// Script to generate AVIF and WebP versions of JPEG images
// Run with: npx tsx generate-static-images.ts

import { existsSync } from 'node:fs'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import sharp from 'sharp'

// Formats type definition
type Formats = 'avif' | 'webp'

// Configuration
const INPUT_DIR = path.join(process.cwd(), 'public', 'images')
const FORMATS: Formats[] = ['avif', 'webp']

async function processDirectory(directory: string): Promise<void> {
  try {
    // Create directory if it doesn't exist
    if (!existsSync(directory)) {
      console.log(`Directory ${directory} doesn't exist. Skipping.`)
      return
    }

    const files = await fs.readdir(directory)

    for (const file of files) {
      const filePath = path.join(directory, file)
      const fileStat = await fs.stat(filePath)

      if (fileStat.isDirectory()) {
        // Recursively process subdirectories
        await processDirectory(filePath)
      } else if (isImageFile(file)) {
        // Process image files
        await processImage(filePath, file)
      }
    }

    console.log(`Processed all images in ${directory}`)
  } catch (err) {
    console.error(`Error processing directory ${directory}:`, err)
  }
}

function isImageFile(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase()
  return ext === '.jpg' || ext === '.jpeg'
}

async function processImage(filePath: string, filename: string): Promise<void> {
  const baseName = path.basename(filename, path.extname(filename))
  const dirName = path.dirname(filePath)

  try {
    const image = sharp(filePath)
    const metadata = await image.metadata()

    console.log(
      `Processing: ${filename} (${metadata.width}x${metadata.height})`,
    )

    const width = Math.max(1, Math.round((metadata.width ?? 1) / 2))
    const height = Math.max(1, Math.round((metadata.height ?? 1) / 2))

    // Process AVIF and WebP formats first
    for (const format of FORMATS) {
      const outputPath = path.join(dirName, `${baseName}.${format}`)

      // Always generate the file, overriding if it exists
      await image
        .clone()
        .resize({ height, width })
        .toFormat(format, { quality: 50 })
        .toFile(outputPath)

      console.log(
        `  Created/Updated ${format}: ${outputPath} (${width}x${height})`,
      )
    }

    // Process JPEG format separately to avoid "same file" error
    const tempJpegPath = path.join(os.tmpdir(), `${baseName}_temp.jpeg`)

    await image
      .clone()
      .resize({ height, width })
      .jpeg({ quality: 50 })
      .toFile(tempJpegPath)

    // Replace original file with new optimized version
    await fs.copyFile(tempJpegPath, path.join(dirName, `${baseName}.jpeg`))
    await fs.unlink(tempJpegPath)

    // If original was .jpg, rename to .jpeg and delete the .jpg
    if (path.extname(filename).toLowerCase() === '.jpg') {
      const jpegPath = path.join(dirName, `${baseName}.jpeg`)

      // If the jpg to jpeg rename would overwrite a file, make sure we've already copied
      // the optimized version to the jpeg path
      if (filePath !== jpegPath) {
        try {
          await fs.unlink(filePath)
          console.log(`  Deleted original .jpg file: ${filePath}`)
        } catch (err) {
          console.error(`  Error deleting original .jpg file: ${filePath}`, err)
        }
      }
    }

    console.log(
      `  Created/Updated jpeg: ${path.join(dirName, `${baseName}.jpeg (${width}x${height})`)}`,
    )
  } catch (err) {
    console.error(`  Error processing ${filename}:`, err)
  }
}
// Main execution
;(async () => {
  console.time('Image processing')
  await processDirectory(INPUT_DIR)
  console.timeEnd('Image processing')
})()
