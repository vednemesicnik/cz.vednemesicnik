import { type ChangeEvent, useEffect, useRef, useState } from 'react'

type Options = {
  onBeforeDelete?: (index: number) => void
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void
}

export const useImagesInput = ({ onBeforeDelete, onChange }: Options) => {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || [])
    const allFiles = [...files, ...selectedFiles]

    // Update state
    setFiles(allFiles)

    // Update input's files using DataTransfer so all files are submitted
    const dataTransfer = new DataTransfer()
    for (const file of allFiles) {
      dataTransfer.items.add(file)
    }
    event.target.files = dataTransfer.files

    // Create new preview URLs and add to existing ones
    const newUrls = selectedFiles.map((file) => URL.createObjectURL(file))
    setPreviews((prev) => [...prev, ...newUrls])

    if (onChange !== undefined) {
      onChange(event)
    }
  }

  const handleDelete = (index: number) => {
    // Call callback before delete
    if (onBeforeDelete !== undefined) {
      onBeforeDelete(index)
    }

    // Revoke the preview URL to free memory
    URL.revokeObjectURL(previews[index])

    // Remove file and preview from state
    const newFiles = files.filter((_, fileIndex) => fileIndex !== index)
    const newPreviews = previews.filter(
      (_, previewIndex) => previewIndex !== index,
    )

    setFiles(newFiles)
    setPreviews(newPreviews)

    // Update file input using DataTransfer
    if (fileInputRef.current) {
      const dataTransfer = new DataTransfer()
      for (const file of newFiles) {
        dataTransfer.items.add(file)
      }
      fileInputRef.current.files = dataTransfer.files
    }
  }

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((url) => {
        URL.revokeObjectURL(url)
      })
    }
  }, [previews])

  return {
    fileInputRef,
    handleDelete,
    handleFileChange,
    previews,
  }
}
