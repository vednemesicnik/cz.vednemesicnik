import { type ChangeEvent, useEffect, useRef, useState } from 'react'

type PreviewItem = {
  src: string
  toDelete: boolean
}

type FileItem = {
  file: File
  toDelete: boolean
}

type Options = {
  onBeforeToggleDelete?: (index: number) => void
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

export const useImagesInput = ({ onBeforeToggleDelete, onChange }: Options) => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [previews, setPreviews] = useState<PreviewItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const newFileItems: FileItem[] = selectedFiles.map((file) => ({
      file,
      toDelete: false,
    }))

    const allFiles = [...files, ...newFileItems]
    setFiles(allFiles)

    // Create new preview URLs and add to existing ones
    const newPreviews: PreviewItem[] = selectedFiles.map((file) => ({
      src: URL.createObjectURL(file),
      toDelete: false,
    }))
    setPreviews((prev) => [...prev, ...newPreviews])

    if (onChange !== undefined) {
      onChange(event)
    }
  }

  const handleToggleDelete = (index: number) => () => {
    // Call callback before toggle
    if (onBeforeToggleDelete !== undefined) {
      onBeforeToggleDelete(index)
    }

    // Toggle toDelete flag for both files and previews
    const updatedFiles = files.map((item, i) =>
      i === index ? { ...item, toDelete: !item.toDelete } : item,
    )
    setFiles(updatedFiles)
    setPreviews((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, toDelete: !item.toDelete } : item,
      ),
    )

    // Update file input with non-deleted files
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer()
      updatedFiles
        .filter((item) => !item.toDelete)
        .forEach((item) => {
          dataTransfer.items.add(item.file)
        })
      fileInputRef.current.files = dataTransfer.files
    }
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((preview) => {
        URL.revokeObjectURL(preview.src)
      })
    }
  }, [previews])

  const filesCount = files.filter((item) => !item.toDelete).length

  return {
    fileInputRef,
    filesCount,
    handleFileChange,
    handleToggleDelete,
    previews,
  }
}
